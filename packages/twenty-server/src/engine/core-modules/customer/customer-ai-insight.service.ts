import { Injectable, NotFoundException } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';

import {
  CustomerAiInsightArgs,
  CustomerAiInsightDTO,
} from 'src/engine/core-modules/customer/dto/customer-ai-insight.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
  name?: string | null;
  customerStage?: string | null;
  customerSource?: string | null;
  lastContactAt?: Date | string | null;
  lastFollowUpAt?: Date | string | null;
};

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeString(value);
};

@Injectable()
export class CustomerAiInsightService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async getCustomerAiInsight(
    workspaceId: string,
    args: CustomerAiInsightArgs,
  ): Promise<CustomerAiInsightDTO> {
    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const customer = await companyRepository.findOne({
        where: {
          id: args.customerId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer was not found.');
      }

      const [contactCount, opportunityCount] = await Promise.all([
        this.countRelatedRecords(workspaceId, 'person', 'companyId', args.customerId),
        this.countRelatedRecords(
          workspaceId,
          'opportunity',
          'companyId',
          args.customerId,
        ),
      ]);
      const customerName = normalizeString(customer.name) ?? 'Customer';

      return {
        customerId: args.customerId,
        contactCount,
        opportunityCount,
        signals: [
          {
            label: 'Customer stage',
            value: normalizeString(customer.customerStage) ?? 'Not classified',
          },
          {
            label: 'Customer source',
            value: normalizeString(customer.customerSource) ?? 'Unknown source',
          },
          {
            label: 'Last follow-up',
            value:
              normalizeDateString(customer.lastFollowUpAt) ??
              normalizeDateString(customer.lastContactAt) ??
              'No touch recorded',
          },
        ],
        status: 'READY_FOR_PHASE_TWO_AI',
        summary: `${customerName} has ${contactCount} contact(s) and ${opportunityCount} linked opportunity record(s). Phase one stores the insight container; generation can be attached later without changing the detail contract.`,
      };
    }, authContext);
  }

  private async countRelatedRecords(
    workspaceId: string,
    objectNameSingular: string,
    fieldName: string,
    customerId: string,
  ) {
    const hasObject = await this.hasWorkspaceObject(workspaceId, objectNameSingular);

    if (!hasObject) {
      return 0;
    }

    const repository =
      await this.globalWorkspaceOrmManager.getRepository<ObjectLiteral>(
        workspaceId,
        objectNameSingular,
        { shouldBypassPermissionChecks: true },
      );

    return repository.count({
      where: {
        [fieldName]: customerId,
      },
    });
  }

  private async hasWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ): Promise<boolean> {
    const objectMetadata = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: {
          nameSingular: objectNameSingular,
        },
      },
    );

    return objectMetadata !== null;
  }
}
