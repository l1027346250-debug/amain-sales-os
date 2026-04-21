import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { createHash, timingSafeEqual } from 'crypto';
import {
  FieldActorSource,
  type ActorMetadata,
  type LinksMetadata,
  type PhonesMetadata,
} from 'twenty-shared/types';
import { type CountryCode } from 'libphonenumber-js';
import { ILike, In, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { CreateEnterpriseWebsiteBindingDto } from 'src/modules/enterprise/independent-station/dtos/create-enterprise-website-binding.dto';
import { ReceiveEnterpriseWebsiteInquiryDto } from 'src/modules/enterprise/independent-station/dtos/receive-enterprise-website-inquiry.dto';
import { ReplaceEnterpriseInquiryAssignmentRulesDto } from 'src/modules/enterprise/independent-station/dtos/replace-enterprise-inquiry-assignment-rules.dto';
import { ReplaceEnterpriseInquiryFormMappingsDto } from 'src/modules/enterprise/independent-station/dtos/replace-enterprise-inquiry-form-mappings.dto';
import { UpdateEnterpriseWebsiteBindingDto } from 'src/modules/enterprise/independent-station/dtos/update-enterprise-website-binding.dto';
import { EnterpriseInquiryAssignmentRuleEntity } from 'src/modules/enterprise/independent-station/enterprise-inquiry-assignment-rule.entity';
import { EnterpriseInquiryFormMappingEntity } from 'src/modules/enterprise/independent-station/enterprise-inquiry-form-mapping.entity';
import { EnterpriseWebsiteBindingEntity } from 'src/modules/enterprise/independent-station/enterprise-website-binding.entity';
import { EnterpriseWebsiteInquiryEntity } from 'src/modules/enterprise/independent-station/enterprise-website-inquiry.entity';
import { type EnterpriseWebsiteBindingStatus } from 'src/modules/enterprise/independent-station/types/enterprise-website-binding-status';
import { type EnterpriseWebsiteInquiryStatus } from 'src/modules/enterprise/independent-station/types/enterprise-website-inquiry-status';
import { addPersonEmailFiltersToQueryBuilder } from 'src/modules/match-participant/utils/add-person-email-filters-to-query-builder';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

const DEFAULT_FORM_MAPPINGS = [
  { externalFieldCode: 'name', crmFieldCode: 'name', required: true },
  { externalFieldCode: 'email', crmFieldCode: 'email', required: true },
  { externalFieldCode: 'phone', crmFieldCode: 'phone', required: false },
  { externalFieldCode: 'company', crmFieldCode: 'companyName', required: false },
  { externalFieldCode: 'country', crmFieldCode: 'country', required: false },
  { externalFieldCode: 'message', crmFieldCode: 'note', required: false },
];

const WEBSITE_BINDING_STATUSES: EnterpriseWebsiteBindingStatus[] = [
  'bound',
  'paused',
  'unbound',
];

const WEBSITE_INQUIRY_STATUSES: EnterpriseWebsiteInquiryStatus[] = [
  'accepted',
  'pending_assignment',
  'blocked',
  'duplicate',
];

const DEFAULT_REPROCESS_INQUIRY_STATUSES: EnterpriseWebsiteInquiryStatus[] = [
  'blocked',
  'pending_assignment',
];

const PERSONAL_EMAIL_DOMAINS = new Set([
  '126.com',
  '163.com',
  'gmail.com',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'outlook.com',
  'qq.com',
  'sina.com',
  'yahoo.com',
]);

const INDEPENDENT_STATION_ACTOR: ActorMetadata = {
  source: FieldActorSource.WEBHOOK,
  workspaceMemberId: null,
  name: 'Independent station webhook',
  context: {},
};

type EnterpriseInquiryCrmSyncResult = {
  action:
    | 'blocked'
    | 'created_person'
    | 'reused_person'
    | 'restored_person'
    | 'skipped_no_email';
  companyId: string | null;
  personId: string | null;
};

@Injectable()
export class EnterpriseIndependentStationService {
  constructor(
    @InjectRepository(EnterpriseWebsiteBindingEntity)
    private readonly enterpriseWebsiteBindingRepository: Repository<EnterpriseWebsiteBindingEntity>,
    @InjectRepository(EnterpriseInquiryFormMappingEntity)
    private readonly enterpriseInquiryFormMappingRepository: Repository<EnterpriseInquiryFormMappingEntity>,
    @InjectRepository(EnterpriseInquiryAssignmentRuleEntity)
    private readonly enterpriseInquiryAssignmentRuleRepository: Repository<EnterpriseInquiryAssignmentRuleEntity>,
    @InjectRepository(EnterpriseWebsiteInquiryEntity)
    private readonly enterpriseWebsiteInquiryRepository: Repository<EnterpriseWebsiteInquiryEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findWebsiteBindings(workspaceId: string) {
    return this.enterpriseWebsiteBindingRepository.find({
      where: { workspaceId },
      order: { boundAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findWebsiteBindingOrFail(workspaceId: string, websiteBindingId: string) {
    const websiteBinding = await this.enterpriseWebsiteBindingRepository.findOne({
      where: { id: websiteBindingId, workspaceId },
    });

    if (!websiteBinding) {
      throw new NotFoundException(
        `Enterprise website binding ${websiteBindingId} was not found`,
      );
    }

    return websiteBinding;
  }

  async createWebsiteBinding(
    workspaceId: string,
    dto: CreateEnterpriseWebsiteBindingDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const websiteName = dto.websiteName?.trim();
    const websiteUrl = this.normalizeWebsiteUrl(dto.websiteUrl);

    if (!websiteName || !websiteUrl) {
      throw new BadRequestException('websiteName and websiteUrl are required');
    }

    const websiteBinding = await this.enterpriseWebsiteBindingRepository.save(
      this.enterpriseWebsiteBindingRepository.create({
        workspaceId,
        websiteName,
        websiteUrl,
        provider: dto.provider?.trim() || 'okki_shops',
        status: this.normalizeStatus(dto.status),
        boundByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        boundAt: new Date(),
        unboundAt: null,
        metadataJson: this.normalizeWebsiteMetadata({
          autoBindForm: true,
          notificationChannels: ['system'],
          notificationRecipients: [],
          ...(dto.metadataJson ?? {}),
        }),
      }),
    );

    await this.ensureDefaultMappings(workspaceId, websiteBinding.id);
    await this.ensureDefaultAssignmentRule(workspaceId, websiteBinding.id);
    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.independentStation.createWebsiteBinding',
      resourceType: 'enterpriseWebsiteBinding',
      resourceId: websiteBinding.id,
      actorWorkspaceMemberId,
      afterJson: this.websiteBindingToAuditJson(websiteBinding),
    });

    return websiteBinding;
  }

  async updateWebsiteBinding(
    workspaceId: string,
    websiteBindingId: string,
    dto: UpdateEnterpriseWebsiteBindingDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const websiteBinding = await this.findWebsiteBindingOrFail(
      workspaceId,
      websiteBindingId,
    );
    const beforeJson = this.websiteBindingToAuditJson(websiteBinding);

    if (dto.websiteName !== undefined) {
      const websiteName = dto.websiteName.trim();

      if (!websiteName) {
        throw new BadRequestException('websiteName cannot be empty');
      }

      websiteBinding.websiteName = websiteName;
    }

    if (dto.websiteUrl !== undefined) {
      websiteBinding.websiteUrl = this.normalizeWebsiteUrl(dto.websiteUrl);
    }

    if (dto.provider !== undefined) {
      websiteBinding.provider = dto.provider.trim() || 'okki_shops';
    }

    if (dto.status !== undefined) {
      websiteBinding.status = this.normalizeStatus(dto.status);
      websiteBinding.unboundAt =
        websiteBinding.status === 'unbound' ? new Date() : null;
    }

    if (dto.metadataJson !== undefined) {
      websiteBinding.metadataJson = this.normalizeWebsiteMetadata(
        dto.metadataJson,
        websiteBinding.metadataJson,
      );
    }

    const savedWebsiteBinding =
      await this.enterpriseWebsiteBindingRepository.save(websiteBinding);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.independentStation.updateWebsiteBinding',
      resourceType: 'enterpriseWebsiteBinding',
      resourceId: savedWebsiteBinding.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: this.websiteBindingToAuditJson(savedWebsiteBinding),
    });

    return savedWebsiteBinding;
  }

  async deleteWebsiteBinding(
    workspaceId: string,
    websiteBindingId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const websiteBinding = await this.findWebsiteBindingOrFail(
      workspaceId,
      websiteBindingId,
    );
    const beforeJson = this.websiteBindingToAuditJson(websiteBinding);

    websiteBinding.status = 'unbound';
    websiteBinding.unboundAt = new Date();

    const savedWebsiteBinding =
      await this.enterpriseWebsiteBindingRepository.save(websiteBinding);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.independentStation.unbindWebsite',
      resourceType: 'enterpriseWebsiteBinding',
      resourceId: savedWebsiteBinding.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: this.websiteBindingToAuditJson(savedWebsiteBinding),
    });

    return savedWebsiteBinding;
  }

  async findFormMappings(workspaceId: string, websiteBindingId: string) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);
    await this.ensureDefaultMappings(workspaceId, websiteBindingId);

    return this.enterpriseInquiryFormMappingRepository.find({
      where: { workspaceId, websiteBindingId },
      order: { externalFieldCode: 'ASC' },
    });
  }

  async replaceFormMappings(
    workspaceId: string,
    websiteBindingId: string,
    dto: ReplaceEnterpriseInquiryFormMappingsDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);

    const mappings = (dto.mappings ?? []).map((mapping) => {
      const externalFieldCode = mapping.externalFieldCode?.trim();
      const crmFieldCode = mapping.crmFieldCode?.trim();

      if (!externalFieldCode || !crmFieldCode) {
        throw new BadRequestException(
          'externalFieldCode and crmFieldCode are required',
        );
      }

      return this.enterpriseInquiryFormMappingRepository.create({
        workspaceId,
        websiteBindingId,
        externalFieldCode,
        crmFieldCode,
        required: mapping.required ?? false,
      });
    });

    await this.enterpriseInquiryFormMappingRepository.delete({
      workspaceId,
      websiteBindingId,
    });

    const savedMappings =
      mappings.length > 0
        ? await this.enterpriseInquiryFormMappingRepository.save(mappings)
        : [];

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.independentStation.replaceFormMappings',
      resourceType: 'enterpriseInquiryFormMapping',
      resourceId: websiteBindingId,
      actorWorkspaceMemberId,
      afterJson: { mappings: savedMappings },
    });

    return savedMappings;
  }

  async findAssignmentRules(workspaceId: string, websiteBindingId: string) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);
    await this.ensureDefaultAssignmentRule(workspaceId, websiteBindingId);

    return this.enterpriseInquiryAssignmentRuleRepository.find({
      where: { workspaceId, websiteBindingId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findInquiries(workspaceId: string, websiteBindingId: string) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);

    return this.enterpriseWebsiteInquiryRepository.find({
      where: { workspaceId, websiteBindingId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async replaceAssignmentRules(
    workspaceId: string,
    websiteBindingId: string,
    dto: ReplaceEnterpriseInquiryAssignmentRulesDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);

    const rules = (dto.rules ?? []).map((rule, index) => {
      const ruleName = rule.ruleName?.trim();
      const assignmentType = rule.assignmentType?.trim() || 'pending_pool';

      if (!ruleName) {
        throw new BadRequestException('ruleName is required');
      }

      return this.enterpriseInquiryAssignmentRuleRepository.create({
        workspaceId,
        websiteBindingId,
        ruleName,
        assignmentType,
        assigneeIds: this.normalizeStringList(rule.assigneeIds ?? []),
        departmentIds: this.normalizeStringList(rule.departmentIds ?? []),
        conditionJson: rule.conditionJson ?? {},
        enabled: rule.enabled ?? true,
        sortOrder: rule.sortOrder ?? index + 1,
      });
    });

    await this.enterpriseInquiryAssignmentRuleRepository.delete({
      workspaceId,
      websiteBindingId,
    });

    const savedRules =
      rules.length > 0
        ? await this.enterpriseInquiryAssignmentRuleRepository.save(rules)
        : [];

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.independentStation.replaceAssignmentRules',
      resourceType: 'enterpriseInquiryAssignmentRule',
      resourceId: websiteBindingId,
      actorWorkspaceMemberId,
      afterJson: { rules: savedRules },
    });

    return savedRules;
  }

  async receiveInquiry(
    tenantKey: string,
    dto: ReceiveEnterpriseWebsiteInquiryDto,
    webhookSecret?: string,
  ) {
    const websiteBinding = await this.resolveWebhookWebsiteBinding(
      tenantKey,
      dto.websiteBindingId,
    );

    if (!websiteBinding || websiteBinding.status !== 'bound') {
      throw new NotFoundException('Active website binding was not found');
    }

    this.assertWebhookSecret(websiteBinding, webhookSecret);

    const externalInquiryId =
      dto.externalInquiryId?.trim() ||
      `inquiry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const existingInquiry = await this.enterpriseWebsiteInquiryRepository.findOne({
      where: {
        workspaceId: websiteBinding.workspaceId,
        websiteBindingId: websiteBinding.id,
        externalInquiryId,
      },
    });

    if (existingInquiry) {
      return {
        accepted: true,
        duplicate: true,
        inquiry: existingInquiry,
      };
    }

    const payloadJson = this.buildInquiryPayload(dto);
    const processingResult = await this.processInquiryPayload(
      websiteBinding.workspaceId,
      websiteBinding.id,
      payloadJson,
    );

    const inquiry = await this.enterpriseWebsiteInquiryRepository.save(
      this.enterpriseWebsiteInquiryRepository.create({
        workspaceId: websiteBinding.workspaceId,
        websiteBindingId: websiteBinding.id,
        externalInquiryId,
        inquiryStatus: processingResult.inquiryStatus,
        leadId: processingResult.crmSyncResult.personId,
        assignedTo: processingResult.decision.assignedTo,
        payloadJson,
        decisionJson: processingResult.decisionJson,
      }),
    );

    await this.enterpriseConfigAuditService.createLog({
      workspaceId: websiteBinding.workspaceId,
      action: 'enterprise.independentStation.receiveInquiry',
      resourceType: 'enterpriseWebsiteInquiry',
      resourceId: inquiry.id,
      afterJson: {
        inquiryStatus: inquiry.inquiryStatus,
        assignedTo: inquiry.assignedTo,
        externalInquiryId: inquiry.externalInquiryId,
      },
    });

    return {
      accepted: inquiry.inquiryStatus !== 'blocked',
      duplicate: false,
      inquiry,
    };
  }

  async reprocessInquiry(
    workspaceId: string,
    websiteBindingId: string,
    inquiryId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);

    const inquiry = await this.enterpriseWebsiteInquiryRepository.findOne({
      where: { id: inquiryId, workspaceId, websiteBindingId },
    });

    if (!inquiry) {
      throw new NotFoundException(
        `Enterprise website inquiry ${inquiryId} was not found`,
      );
    }

    const beforeJson = {
      assignedTo: inquiry.assignedTo,
      decisionJson: inquiry.decisionJson,
      inquiryStatus: inquiry.inquiryStatus,
      leadId: inquiry.leadId,
    };
    const processingResult = await this.processInquiryPayload(
      workspaceId,
      websiteBindingId,
      inquiry.payloadJson,
    );

    inquiry.inquiryStatus = processingResult.inquiryStatus;
    inquiry.assignedTo = processingResult.decision.assignedTo;
    inquiry.leadId = processingResult.crmSyncResult.personId;
    inquiry.decisionJson = processingResult.decisionJson;

    const savedInquiry =
      await this.enterpriseWebsiteInquiryRepository.save(inquiry);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.independentStation.reprocessInquiry',
      resourceType: 'enterpriseWebsiteInquiry',
      resourceId: savedInquiry.id,
      actorWorkspaceMemberId,
      beforeJson,
      afterJson: {
        assignedTo: savedInquiry.assignedTo,
        decisionJson: savedInquiry.decisionJson,
        inquiryStatus: savedInquiry.inquiryStatus,
        leadId: savedInquiry.leadId,
      },
    });

    return savedInquiry;
  }

  async reprocessInquiries(
    workspaceId: string,
    websiteBindingId: string,
    statuses: string[] | undefined,
    actorWorkspaceMemberId?: string | null,
  ) {
    await this.findWebsiteBindingOrFail(workspaceId, websiteBindingId);

    const normalizedStatuses = this.normalizeInquiryStatuses(statuses);
    const inquiries = await this.enterpriseWebsiteInquiryRepository.find({
      where: {
        workspaceId,
        websiteBindingId,
        inquiryStatus: In(normalizedStatuses),
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const reprocessedInquiries = [];

    for (const inquiry of inquiries) {
      const reprocessedInquiry = await this.reprocessInquiry(
        workspaceId,
        websiteBindingId,
        inquiry.id,
        actorWorkspaceMemberId,
      );

      reprocessedInquiries.push(reprocessedInquiry);
    }

    return {
      inquiries: reprocessedInquiries,
      processedCount: reprocessedInquiries.length,
      requestedStatuses: normalizedStatuses,
    };
  }

  private async processInquiryPayload(
    workspaceId: string,
    websiteBindingId: string,
    payloadJson: Record<string, unknown>,
  ) {
    const mappings = await this.findFormMappings(workspaceId, websiteBindingId);
    const missingRequiredFields = mappings
      .filter((mapping) => mapping.required)
      .filter(
        (mapping) => !this.hasValue(payloadJson[mapping.externalFieldCode]),
      )
      .map((mapping) => mapping.externalFieldCode);
    const decision = await this.resolveAssignmentDecision(
      workspaceId,
      websiteBindingId,
      payloadJson,
    );
    const inquiryStatus = this.resolveInquiryStatus(
      missingRequiredFields,
      decision.assignedTo,
    );
    const crmSyncResult = await this.syncAcceptedInquiryToCrm({
      inquiryStatus,
      payloadJson,
      workspaceId,
    });
    const decisionJson = {
      ...decision,
      crmRecord: crmSyncResult,
      missingRequiredFields,
      mappedFields: mappings.map((mapping) => ({
        externalFieldCode: mapping.externalFieldCode,
        crmFieldCode: mapping.crmFieldCode,
      })),
    };

    return {
      crmSyncResult,
      decision,
      decisionJson,
      inquiryStatus,
    };
  }

  private async syncAcceptedInquiryToCrm({
    inquiryStatus,
    payloadJson,
    workspaceId,
  }: {
    inquiryStatus: EnterpriseWebsiteInquiryStatus;
    payloadJson: Record<string, unknown>;
    workspaceId: string;
  }): Promise<EnterpriseInquiryCrmSyncResult> {
    if (inquiryStatus === 'blocked') {
      return {
        action: 'blocked',
        companyId: null,
        personId: null,
      };
    }

    const email = this.normalizeEmail(this.pickPayloadString(payloadJson, 'email'));

    if (!email) {
      return {
        action: 'skipped_no_email',
        companyId: null,
        personId: null,
      };
    }

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const companyId = await this.findOrCreateCompanyFromInquiry(
          workspaceId,
          payloadJson,
          email,
        );
        const personRepository =
          await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            PersonWorkspaceEntity,
            {
              shouldBypassPermissionChecks: true,
            },
          );
        const personQueryBuilder = addPersonEmailFiltersToQueryBuilder({
          queryBuilder: personRepository.createQueryBuilder('person'),
          emails: [email],
        });
        const existingPerson = await personQueryBuilder
          .withDeleted()
          .getOne();

        if (existingPerson) {
          if (existingPerson.deletedAt !== null) {
            await personRepository.updateMany([
              {
                criteria: existingPerson.id,
                partialEntity: {
                  companyId: companyId ?? undefined,
                  deletedAt: null,
                  updatedBy: INDEPENDENT_STATION_ACTOR,
                },
              },
            ]);

            return {
              action: 'restored_person',
              companyId,
              personId: existingPerson.id,
            };
          }

          return {
            action: 'reused_person',
            companyId,
            personId: existingPerson.id,
          };
        }

        const personId = v4();
        const lastPersonPosition =
          (await personRepository.maximum('position', undefined)) ?? 0;
        const phone = this.pickPayloadString(payloadJson, 'phone');

        await personRepository.insert([
          {
            id: personId,
            companyId,
            createdBy: INDEPENDENT_STATION_ACTOR,
            emails: {
              primaryEmail: email,
              additionalEmails: null,
            },
            name: this.buildPersonName(payloadJson, email),
            phone,
            phones: this.buildPhonesValue(phone),
            position: lastPersonPosition + 1,
            updatedBy: INDEPENDENT_STATION_ACTOR,
          },
        ]);

        return {
          action: 'created_person',
          companyId,
          personId,
        };
      },
      authContext,
    );
  }

  private async findOrCreateCompanyFromInquiry(
    workspaceId: string,
    payloadJson: Record<string, unknown>,
    email: string,
  ) {
    const companyName =
      this.pickPayloadString(payloadJson, 'company') ??
      this.pickPayloadString(payloadJson, 'companyName');
    const emailDomain = this.getWorkEmailDomain(email);
    const companyRepository =
      await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        CompanyWorkspaceEntity,
        {
          shouldBypassPermissionChecks: true,
        },
      );
    const whereConditions = [
      ...(emailDomain
        ? [
            {
              domainName: {
                primaryLinkUrl: ILike(`%${emailDomain}%`),
              },
            },
          ]
        : []),
      ...(companyName
        ? [
            {
              name: ILike(companyName),
            },
          ]
        : []),
    ];
    const existingCompany =
      whereConditions.length > 0
        ? await companyRepository.findOne({
            where: whereConditions,
            withDeleted: true,
          })
        : null;

    if (existingCompany) {
      if (existingCompany.deletedAt !== null) {
        await companyRepository.updateMany([
          {
            criteria: existingCompany.id,
            partialEntity: {
              deletedAt: null,
              updatedBy: INDEPENDENT_STATION_ACTOR,
            },
          },
        ]);
      }

      return existingCompany.id;
    }

    if (!emailDomain) {
      return null;
    }

    const companyId = v4();
    const lastCompanyPosition =
      (await companyRepository.maximum('position', undefined)) ?? 0;

    await companyRepository.insert([
      {
        id: companyId,
        createdBy: INDEPENDENT_STATION_ACTOR,
        domainName: this.buildDomainValue(emailDomain),
        name: companyName ?? emailDomain,
        position: lastCompanyPosition + 1,
        updatedBy: INDEPENDENT_STATION_ACTOR,
      },
    ]);

    return companyId;
  }

  private async ensureDefaultMappings(
    workspaceId: string,
    websiteBindingId: string,
  ) {
    const existingCount = await this.enterpriseInquiryFormMappingRepository.count({
      where: { workspaceId, websiteBindingId },
    });

    if (existingCount > 0) {
      return;
    }

    await this.enterpriseInquiryFormMappingRepository.save(
      DEFAULT_FORM_MAPPINGS.map((mapping) =>
        this.enterpriseInquiryFormMappingRepository.create({
          workspaceId,
          websiteBindingId,
          ...mapping,
        }),
      ),
    );
  }

  private async ensureDefaultAssignmentRule(
    workspaceId: string,
    websiteBindingId: string,
  ) {
    const existingCount =
      await this.enterpriseInquiryAssignmentRuleRepository.count({
        where: { workspaceId, websiteBindingId },
      });

    if (existingCount > 0) {
      return;
    }

    await this.enterpriseInquiryAssignmentRuleRepository.save(
      this.enterpriseInquiryAssignmentRuleRepository.create({
        workspaceId,
        websiteBindingId,
        ruleName: '默认进入待分配池',
        assignmentType: 'pending_pool',
        assigneeIds: [],
        departmentIds: [],
        conditionJson: {},
        enabled: true,
        sortOrder: 1,
      }),
    );
  }

  private async resolveWebhookWebsiteBinding(
    tenantKey: string,
    websiteBindingId?: string,
  ) {
    if (websiteBindingId && this.isUuidLike(websiteBindingId)) {
      return this.enterpriseWebsiteBindingRepository.findOne({
        where: { id: websiteBindingId },
      });
    }

    if (this.isUuidLike(tenantKey)) {
      const websiteBindingById =
        await this.enterpriseWebsiteBindingRepository.findOne({
          where: { id: tenantKey },
        });

      if (websiteBindingById) {
        return websiteBindingById;
      }

      return this.enterpriseWebsiteBindingRepository.findOne({
        where: { workspaceId: tenantKey, status: 'bound' },
        order: { boundAt: 'DESC', createdAt: 'DESC' },
      });
    }

    return null;
  }

  private async resolveAssignmentDecision(
    workspaceId: string,
    websiteBindingId: string,
    payloadJson: Record<string, unknown>,
  ) {
    const rules = await this.enterpriseInquiryAssignmentRuleRepository.find({
      where: { workspaceId, websiteBindingId, enabled: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    const matchedRule =
      rules.find((rule) => this.matchesCondition(rule.conditionJson, payloadJson)) ??
      null;
    const assignedTo = this.pickAssignee(matchedRule);

    return {
      ruleId: matchedRule?.id ?? null,
      ruleName: matchedRule?.ruleName ?? null,
      assignmentType: matchedRule?.assignmentType ?? 'pending_pool',
      assignedTo,
    };
  }

  private matchesCondition(
    conditionJson: Record<string, unknown>,
    payloadJson: Record<string, unknown>,
  ) {
    const country = conditionJson.country;
    const sourcePage = conditionJson.sourcePage;

    if (typeof country === 'string' && country.trim()) {
      return String(payloadJson.country ?? '') === country.trim();
    }

    if (typeof sourcePage === 'string' && sourcePage.trim()) {
      return String(payloadJson.sourcePage ?? '').includes(sourcePage.trim());
    }

    return true;
  }

  private pickAssignee(rule: EnterpriseInquiryAssignmentRuleEntity | null) {
    if (!rule) {
      return null;
    }

    if (rule.assignmentType === 'fixed_user') {
      return rule.assigneeIds[0] ?? null;
    }

    if (rule.assignmentType === 'round_robin') {
      return rule.assigneeIds[0] ?? null;
    }

    if (rule.assignmentType === 'department_pool') {
      return rule.departmentIds[0] ?? null;
    }

    return null;
  }

  private resolveInquiryStatus(
    missingRequiredFields: string[],
    assignedTo: string | null,
  ): EnterpriseWebsiteInquiryStatus {
    if (missingRequiredFields.length > 0) {
      return 'blocked';
    }

    return assignedTo ? 'accepted' : 'pending_assignment';
  }

  private buildInquiryPayload(
    dto: ReceiveEnterpriseWebsiteInquiryDto,
  ): Record<string, unknown> {
    return {
      ...(dto.payloadJson ?? {}),
      ...(dto.formFields ?? {}),
      name: dto.visitorName,
      email: dto.email,
      phone: dto.phone,
      company: dto.companyName,
      country: dto.country,
      message: dto.message,
      sourcePage: dto.sourcePage,
    };
  }

  private assertWebhookSecret(
    websiteBinding: EnterpriseWebsiteBindingEntity,
    webhookSecret?: string,
  ) {
    const configuredSecretHash = this.pickPayloadString(
      websiteBinding.metadataJson,
      'webhookSecretHash',
    );

    if (!configuredSecretHash) {
      return;
    }

    if (!webhookSecret) {
      throw new UnauthorizedException('Missing webhook secret');
    }

    const providedSecretHash = this.hashWebhookSecret(webhookSecret);
    const configuredSecretHashBuffer = Buffer.from(configuredSecretHash, 'hex');
    const providedSecretHashBuffer = Buffer.from(providedSecretHash, 'hex');

    if (
      configuredSecretHashBuffer.length !== providedSecretHashBuffer.length ||
      !timingSafeEqual(configuredSecretHashBuffer, providedSecretHashBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  private normalizeWebsiteMetadata(
    metadataJson: Record<string, unknown> | null | undefined,
    previousMetadataJson: Record<string, unknown> = {},
  ) {
    const metadata = {
      ...previousMetadataJson,
      ...(metadataJson ?? {}),
    };
    const webhookSecret = this.pickPayloadString(
      metadataJson ?? {},
      'webhookSecret',
    );

    delete metadata.webhookSecret;

    if (webhookSecret) {
      metadata.webhookSecretHash = this.hashWebhookSecret(webhookSecret);
      metadata.webhookSecretHint = this.buildWebhookSecretHint(webhookSecret);
    }

    return metadata;
  }

  private hashWebhookSecret(webhookSecret: string) {
    return createHash('sha256').update(webhookSecret).digest('hex');
  }

  private buildWebhookSecretHint(webhookSecret: string) {
    if (webhookSecret.length <= 8) {
      return '已设置';
    }

    return `${webhookSecret.slice(0, 4)}...${webhookSecret.slice(-4)}`;
  }

  private buildPersonName(payloadJson: Record<string, unknown>, email: string) {
    const visitorName =
      this.pickPayloadString(payloadJson, 'name') ??
      this.pickPayloadString(payloadJson, 'visitorName') ??
      email.split('@')[0];
    const [firstName, ...lastNameParts] = visitorName.split(/\s+/);

    return {
      firstName: firstName ?? '',
      lastName: lastNameParts.join(' '),
    };
  }

  private buildPhonesValue(phone: string | null): PhonesMetadata | undefined {
    if (!phone) {
      return undefined;
    }

    return {
      additionalPhones: null,
      primaryPhoneCallingCode: '',
      primaryPhoneCountryCode: '' as CountryCode,
      primaryPhoneNumber: phone,
    };
  }

  private buildDomainValue(domain: string): LinksMetadata {
    return {
      primaryLinkLabel: domain,
      primaryLinkUrl: `https://${domain}`,
      secondaryLinks: null,
    };
  }

  private pickPayloadString(payloadJson: Record<string, unknown>, key: string) {
    const value = payloadJson[key];

    if (!this.hasValue(value)) {
      return null;
    }

    return String(value).trim();
  }

  private normalizeEmail(email: string | null) {
    if (!email) {
      return null;
    }

    const normalizedEmail = email.toLowerCase();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ? normalizedEmail
      : null;
  }

  private getWorkEmailDomain(email: string) {
    const domain = email.split('@')[1]?.toLowerCase().replace(/^www\./, '');

    if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain)) {
      return null;
    }

    return domain;
  }

  private normalizeWebsiteUrl(websiteUrl?: string) {
    const trimmedWebsiteUrl = websiteUrl?.trim();

    if (!trimmedWebsiteUrl) {
      throw new BadRequestException('websiteUrl is required');
    }

    if (!/^https?:\/\//i.test(trimmedWebsiteUrl)) {
      return `https://${trimmedWebsiteUrl}`;
    }

    return trimmedWebsiteUrl;
  }

  private normalizeStatus(status?: string): EnterpriseWebsiteBindingStatus {
    const normalizedStatus = status?.trim() as EnterpriseWebsiteBindingStatus;

    if (normalizedStatus && WEBSITE_BINDING_STATUSES.includes(normalizedStatus)) {
      return normalizedStatus;
    }

    return 'bound';
  }

  private normalizeInquiryStatuses(
    statuses: string[] | undefined,
  ): EnterpriseWebsiteInquiryStatus[] {
    if (!statuses || statuses.length === 0) {
      return DEFAULT_REPROCESS_INQUIRY_STATUSES;
    }

    const normalizedStatuses = statuses.map((status) =>
      status.trim(),
    ) as EnterpriseWebsiteInquiryStatus[];
    const invalidStatuses = normalizedStatuses.filter(
      (status) => !WEBSITE_INQUIRY_STATUSES.includes(status),
    );

    if (invalidStatuses.length > 0) {
      throw new BadRequestException(
        `Invalid inquiry statuses: ${invalidStatuses.join(', ')}`,
      );
    }

    return normalizedStatuses.filter(
      (status, index, list) => list.indexOf(status) === index,
    );
  }

  private normalizeStringList(values: string[]) {
    return values
      .map((value) => value.trim())
      .filter((value, index, list) => value && list.indexOf(value) === index);
  }

  private hasValue(value: unknown) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  private isUuidLike(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private websiteBindingToAuditJson(websiteBinding: EnterpriseWebsiteBindingEntity) {
    return {
      id: websiteBinding.id,
      websiteName: websiteBinding.websiteName,
      websiteUrl: websiteBinding.websiteUrl,
      provider: websiteBinding.provider,
      status: websiteBinding.status,
      metadataJson: websiteBinding.metadataJson,
    };
  }
}
