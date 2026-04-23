import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { CreateEnterpriseReportTemplateDto } from 'src/modules/enterprise/report-template/dtos/create-enterprise-report-template.dto';
import { UpdateEnterpriseReportTemplateDto } from 'src/modules/enterprise/report-template/dtos/update-enterprise-report-template.dto';
import { EnterpriseReportTemplateVersionEntity } from 'src/modules/enterprise/report-template/enterprise-report-template-version.entity';
import { EnterpriseReportTemplateEntity } from 'src/modules/enterprise/report-template/enterprise-report-template.entity';

const REPORT_TYPE_LABELS: Record<string, string> = {
  custom: '自定义报告',
  daily: '日报',
  monthly: '月报',
  quarterly: '季报',
  weekly: '周报',
};

const REPORT_SECTION_LABELS: Record<string, string> = {
  customerFocus: '客户聚焦',
  'customer-focus': '客户聚焦',
  followUpRisk: '跟进风险',
  'follow-up-risk': '跟进风险',
  opportunityProgress: '商机推进',
  'opportunity-progress': '商机推进',
  ownerProgress: '负责人进展',
  'owner-progress': '负责人进展',
  pipelineHealth: '管道健康度',
  'pipeline-health': '管道健康度',
  summary: '经营摘要',
};

const DELIVERY_CHANNEL_LABELS: Record<string, string> = {
  dashboard: '控制台',
  email: '邮件',
};

@Injectable()
export class EnterpriseReportTemplateService {
  constructor(
    @InjectRepository(EnterpriseReportTemplateEntity)
    private readonly enterpriseReportTemplateRepository: Repository<EnterpriseReportTemplateEntity>,
    @InjectRepository(EnterpriseReportTemplateVersionEntity)
    private readonly enterpriseReportTemplateVersionRepository: Repository<EnterpriseReportTemplateVersionEntity>,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async findMany(workspaceId: string) {
    return this.enterpriseReportTemplateRepository.find({
      where: { workspaceId },
      order: {
        isDefault: 'DESC',
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async findOneOrFail(workspaceId: string, templateId: string) {
    const template = await this.enterpriseReportTemplateRepository.findOne({
      where: {
        id: templateId,
        workspaceId,
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Enterprise report template ${templateId} was not found`,
      );
    }

    return template;
  }

  async findVersions(workspaceId: string, templateId: string) {
    await this.findOneOrFail(workspaceId, templateId);

    return this.enterpriseReportTemplateVersionRepository.find({
      where: {
        workspaceId,
        templateId,
      },
      order: {
        versionNumber: 'DESC',
      },
    });
  }

  async previewTemplate(
    workspaceId: string,
    templateId: string,
    versionNumber?: number,
  ) {
    const template = await this.findOneOrFail(workspaceId, templateId);
    const version = versionNumber
      ? await this.enterpriseReportTemplateVersionRepository.findOne({
          where: {
            workspaceId,
            templateId,
            versionNumber,
          },
        })
      : template.currentVersionId
        ? await this.enterpriseReportTemplateVersionRepository.findOne({
            where: {
              workspaceId,
              id: template.currentVersionId,
            },
          })
        : null;

    const snapshot = version ?? {
      templateName: template.templateName,
      templateCode: template.templateCode,
      reportType: template.reportType,
      description: template.description,
      sectionKeys: template.sectionKeys,
      recipientRoleCodes: template.recipientRoleCodes,
      deliveryChannel: template.deliveryChannel,
      isActive: template.isActive,
      isDefault: template.isDefault,
      versionNumber: template.version,
      createdAt: template.updatedAt,
    };

    return this.buildPreview(snapshot);
  }

  async createTemplate(
    workspaceId: string,
    dto: CreateEnterpriseReportTemplateDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const templateName = dto.templateName?.trim();
    const templateCode = dto.templateCode?.trim().toLowerCase();
    const reportType = dto.reportType?.trim();

    if (!templateName || !templateCode || !reportType) {
      throw new BadRequestException(
        'templateName, templateCode, and reportType are required',
      );
    }

    await this.assertTemplateCodeAvailable(workspaceId, templateCode);

    const template = await this.enterpriseReportTemplateRepository.save(
      this.enterpriseReportTemplateRepository.create({
        workspaceId,
        templateName,
        templateCode,
        reportType,
        description: dto.description?.trim() || null,
        sectionKeys: this.normalizeStringList(dto.sectionKeys),
        recipientRoleCodes: this.normalizeStringList(dto.recipientRoleCodes),
        deliveryChannel: dto.deliveryChannel?.trim() || 'dashboard',
        isActive: dto.isActive ?? true,
        isDefault: false,
        version: 1,
        currentVersionId: null,
        createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
        updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
      }),
    );

    const nextDefaultState = await this.resolveDefaultState({
      workspaceId,
      reportType,
      requestedDefault: dto.isDefault,
      templateIsActive: template.isActive,
    });

    template.isDefault = nextDefaultState;
    const version = await this.createVersionSnapshot({
      template,
      versionNumber: 1,
      actorWorkspaceMemberId,
    });

    template.currentVersionId = version.id;
    await this.enterpriseReportTemplateRepository.save(template);

    if (template.isDefault) {
      await this.setDefaultTemplateInternal({
        workspaceId,
        templateId: template.id,
        reportType: template.reportType,
      });
    } else {
      await this.ensureSingleDefaultTemplate(workspaceId, template.reportType);
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.reportTemplate.create',
      resourceType: 'enterpriseReportTemplate',
      resourceId: template.id,
      actorWorkspaceMemberId,
      afterJson: {
        templateName: template.templateName,
        templateCode: template.templateCode,
        reportType: template.reportType,
        deliveryChannel: template.deliveryChannel,
        isDefault: template.isDefault,
        version: template.version,
      },
    });

    return this.findOneOrFail(workspaceId, template.id);
  }

  async updateTemplate(
    workspaceId: string,
    templateId: string,
    dto: UpdateEnterpriseReportTemplateDto,
    actorWorkspaceMemberId?: string | null,
  ) {
    const currentTemplate = await this.findOneOrFail(workspaceId, templateId);
    const previousReportType = currentTemplate.reportType;
    const nextTemplateName = dto.templateName?.trim() || currentTemplate.templateName;
    const nextReportType = dto.reportType?.trim() || currentTemplate.reportType;
    const nextIsActive = dto.isActive ?? currentTemplate.isActive;

    if (!nextTemplateName || !nextReportType) {
      throw new BadRequestException('templateName and reportType cannot be empty');
    }

    const requestedDefault = dto.isDefault ?? currentTemplate.isDefault;
    const nextIsDefault = nextIsActive
      ? requestedDefault
      : false;

    const templateToSave = {
      ...currentTemplate,
      templateName: nextTemplateName,
      reportType: nextReportType,
      description:
        dto.description === undefined
          ? currentTemplate.description
          : dto.description?.trim() || null,
      sectionKeys:
        dto.sectionKeys === undefined
          ? currentTemplate.sectionKeys
          : this.normalizeStringList(dto.sectionKeys),
      recipientRoleCodes:
        dto.recipientRoleCodes === undefined
          ? currentTemplate.recipientRoleCodes
          : this.normalizeStringList(dto.recipientRoleCodes),
      deliveryChannel:
        dto.deliveryChannel === undefined
          ? currentTemplate.deliveryChannel
          : dto.deliveryChannel.trim() || 'dashboard',
      isActive: nextIsActive,
      isDefault: nextIsDefault,
      version: currentTemplate.version + 1,
      updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
    } satisfies EnterpriseReportTemplateEntity;

    await this.enterpriseReportTemplateRepository.save(templateToSave);
    const version = await this.createVersionSnapshot({
      template: templateToSave,
      versionNumber: templateToSave.version,
      actorWorkspaceMemberId,
    });

    await this.enterpriseReportTemplateRepository.save({
      ...templateToSave,
      currentVersionId: version.id,
    });

    if (templateToSave.isDefault) {
      await this.setDefaultTemplateInternal({
        workspaceId,
        templateId,
        reportType: templateToSave.reportType,
      });
    }

    await this.ensureSingleDefaultTemplate(workspaceId, templateToSave.reportType);

    if (previousReportType !== templateToSave.reportType) {
      await this.ensureSingleDefaultTemplate(workspaceId, previousReportType);
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.reportTemplate.update',
      resourceType: 'enterpriseReportTemplate',
      resourceId: currentTemplate.id,
      actorWorkspaceMemberId,
      afterJson: {
        templateName: nextTemplateName,
        reportType: nextReportType,
        isActive: templateToSave.isActive,
        isDefault: templateToSave.isDefault,
        version: templateToSave.version,
      },
    });

    return this.findOneOrFail(workspaceId, templateId);
  }

  async setDefaultTemplate(
    workspaceId: string,
    templateId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const template = await this.findOneOrFail(workspaceId, templateId);
    const nextVersionNumber = template.version + 1;
    const nextTemplate = {
      ...template,
      isActive: true,
      isDefault: true,
      version: nextVersionNumber,
      updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
    } satisfies EnterpriseReportTemplateEntity;

    await this.enterpriseReportTemplateRepository.save(nextTemplate);
    await this.setDefaultTemplateInternal({
      workspaceId,
      templateId,
      reportType: template.reportType,
    });

    const version = await this.createVersionSnapshot({
      template: nextTemplate,
      versionNumber: nextVersionNumber,
      actorWorkspaceMemberId,
    });

    await this.enterpriseReportTemplateRepository.save({
      ...nextTemplate,
      currentVersionId: version.id,
    });

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.reportTemplate.setDefault',
      resourceType: 'enterpriseReportTemplate',
      resourceId: template.id,
      actorWorkspaceMemberId,
      afterJson: {
        reportType: template.reportType,
        version: nextVersionNumber,
      },
    });

    return this.findOneOrFail(workspaceId, templateId);
  }

  async setActiveState(
    workspaceId: string,
    templateId: string,
    isActive: boolean,
    actorWorkspaceMemberId?: string | null,
  ) {
    const template = await this.findOneOrFail(workspaceId, templateId);
    const nextVersionNumber = template.version + 1;
    const nextTemplate = {
      ...template,
      isActive,
      isDefault: isActive ? template.isDefault : false,
      version: nextVersionNumber,
      updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
    } satisfies EnterpriseReportTemplateEntity;

    await this.enterpriseReportTemplateRepository.save(nextTemplate);

    const version = await this.createVersionSnapshot({
      template: nextTemplate,
      versionNumber: nextVersionNumber,
      actorWorkspaceMemberId,
    });

    await this.enterpriseReportTemplateRepository.save({
      ...nextTemplate,
      currentVersionId: version.id,
    });

    await this.ensureSingleDefaultTemplate(workspaceId, template.reportType);

    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: isActive
        ? 'enterprise.reportTemplate.activate'
        : 'enterprise.reportTemplate.deactivate',
      resourceType: 'enterpriseReportTemplate',
      resourceId: template.id,
      actorWorkspaceMemberId,
      afterJson: {
        isActive,
        version: nextVersionNumber,
      },
    });

    return this.findOneOrFail(workspaceId, templateId);
  }

  async deleteTemplate(
    workspaceId: string,
    templateId: string,
    actorWorkspaceMemberId?: string | null,
  ) {
    const template = await this.findOneOrFail(workspaceId, templateId);

    await this.enterpriseReportTemplateVersionRepository.delete({
      workspaceId,
      templateId,
    });
    await this.enterpriseReportTemplateRepository.delete({
      id: templateId,
      workspaceId,
    });
    await this.ensureSingleDefaultTemplate(workspaceId, template.reportType);
    await this.enterpriseConfigAuditService.createLog({
      workspaceId,
      action: 'enterprise.reportTemplate.delete',
      resourceType: 'enterpriseReportTemplate',
      resourceId: template.id,
      actorWorkspaceMemberId,
      beforeJson: {
        templateName: template.templateName,
        templateCode: template.templateCode,
        reportType: template.reportType,
        isActive: template.isActive,
        isDefault: template.isDefault,
        version: template.version,
      },
    });

    return {
      deleted: true,
      id: templateId,
    };
  }

  private async assertTemplateCodeAvailable(
    workspaceId: string,
    templateCode: string,
  ) {
    const existingTemplate = await this.enterpriseReportTemplateRepository.findOne({
      where: {
        workspaceId,
        templateCode,
      },
    });

    if (existingTemplate) {
      throw new BadRequestException(
        `Enterprise report template code ${templateCode} already exists`,
      );
    }
  }

  private async createVersionSnapshot({
    template,
    versionNumber,
    actorWorkspaceMemberId,
  }: {
    template: EnterpriseReportTemplateEntity;
    versionNumber: number;
    actorWorkspaceMemberId?: string | null;
  }) {
    return this.enterpriseReportTemplateVersionRepository.save(
      this.enterpriseReportTemplateVersionRepository.create({
        workspaceId: template.workspaceId,
        templateId: template.id,
        versionNumber,
        templateName: template.templateName,
        templateCode: template.templateCode,
        reportType: template.reportType,
        description: template.description,
        sectionKeys: template.sectionKeys,
        recipientRoleCodes: template.recipientRoleCodes,
        deliveryChannel: template.deliveryChannel,
        isActive: template.isActive,
        isDefault: template.isDefault,
        previewJson: this.buildPreview({
          ...template,
          versionNumber,
          createdAt: new Date(),
        }),
        createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
      }),
    );
  }

  private async resolveDefaultState({
    workspaceId,
    reportType,
    requestedDefault,
    templateIsActive,
  }: {
    workspaceId: string;
    reportType: string;
    requestedDefault?: boolean;
    templateIsActive: boolean;
  }) {
    if (!templateIsActive) {
      return false;
    }

    if (requestedDefault === true) {
      return true;
    }

    if (requestedDefault === false) {
      return false;
    }

    const existingDefault = await this.enterpriseReportTemplateRepository.findOne({
      where: {
        workspaceId,
        reportType,
        isDefault: true,
        isActive: true,
      },
    });

    return !existingDefault;
  }

  private async setDefaultTemplateInternal({
    workspaceId,
    templateId,
    reportType,
  }: {
    workspaceId: string;
    templateId: string;
    reportType: string;
  }) {
    await this.enterpriseReportTemplateRepository
      .createQueryBuilder()
      .update(EnterpriseReportTemplateEntity)
      .set({ isDefault: false })
      .where('workspaceId = :workspaceId', { workspaceId })
      .andWhere('reportType = :reportType', { reportType })
      .andWhere('id != :templateId', { templateId })
      .execute();

    await this.enterpriseReportTemplateRepository.update(templateId, {
      isDefault: true,
      isActive: true,
    });
  }

  private async ensureSingleDefaultTemplate(
    workspaceId: string,
    reportType: string,
  ) {
    const activeTemplates = await this.enterpriseReportTemplateRepository.find({
      where: {
        workspaceId,
        reportType,
        isActive: true,
      },
      order: {
        isDefault: 'DESC',
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (activeTemplates.length === 0) {
      await this.enterpriseReportTemplateRepository.update(
        { workspaceId, reportType },
        { isDefault: false },
      );

      return;
    }

    const defaultTemplate =
      activeTemplates.find((template) => template.isDefault) ?? activeTemplates[0];

    await this.enterpriseReportTemplateRepository
      .createQueryBuilder()
      .update(EnterpriseReportTemplateEntity)
      .set({ isDefault: false })
      .where('workspaceId = :workspaceId', { workspaceId })
      .andWhere('reportType = :reportType', { reportType })
      .execute();

    await this.enterpriseReportTemplateRepository.update(defaultTemplate.id, {
      isDefault: true,
    });
  }

  private buildPreview(snapshot: {
    templateName: string;
    reportType: string;
    description: string | null;
    sectionKeys: string[];
    recipientRoleCodes: string[];
    deliveryChannel: string;
    isActive: boolean;
    isDefault: boolean;
    versionNumber: number;
    createdAt: Date;
  }) {
    const reportTypeLabel = REPORT_TYPE_LABELS[snapshot.reportType] ?? snapshot.reportType;
    const deliveryChannelLabel =
      DELIVERY_CHANNEL_LABELS[snapshot.deliveryChannel] ?? snapshot.deliveryChannel;
    const sections = snapshot.sectionKeys.map((sectionKey, index) => ({
      key: sectionKey,
      title: REPORT_SECTION_LABELS[sectionKey] ?? this.humanizeKey(sectionKey),
      summary:
        index === 0
          ? '优先展示经营结论、关键异常和需要管理层确认的动作。'
          : '这一节承接模板字段与后续生成器，输出可复核的业务摘要。',
    }));

    return {
      title: `${snapshot.templateName} 预览`,
      subtitle: `${reportTypeLabel} · v${snapshot.versionNumber} · ${deliveryChannelLabel}`,
      description:
        snapshot.description ||
        '该模板将作为企业管理报告的结构骨架，用于后续定时生成、审批和分发。',
      recipients: snapshot.recipientRoleCodes,
      status: {
        isActive: snapshot.isActive,
        isDefault: snapshot.isDefault,
      },
      sections,
      generatedAt: snapshot.createdAt.toISOString(),
    };
  }

  private humanizeKey(value: string) {
    return value
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (segment) => segment.toUpperCase());
  }

  private normalizeStringList(values?: string[]) {
    return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
  }
}
