import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { type ObjectLiteral } from 'typeorm';
import { type QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import {
  RefreshCustomerCommercialSummaryInput,
  RefreshCustomerCommercialSummaryResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-commercial-summary.dto';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

type WorkspaceCompanyRecord = ObjectLiteral & {
  id: string;
};

type WorkspaceOpportunityRecord = ObjectLiteral & {
  id: string;
  companyId?: string | null;
  amount?: Record<string, unknown> | null;
  closeDate?: Date | string | null;
  stage?: string | null;
};

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDateString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeString(value);
};

const getAmountValue = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const amountMicros = (value as { amountMicros?: unknown }).amountMicros;

  return typeof amountMicros === 'number' && Number.isFinite(amountMicros)
    ? amountMicros / 1_000_000
    : 0;
};

const isWonOpportunity = (record: WorkspaceOpportunityRecord) => {
  const stage = normalizeString(record.stage)?.toUpperCase() ?? '';

  return ['WON', 'CLOSED_WON', 'CUSTOMER', '成交'].some((value) =>
    stage.includes(value),
  );
};

@Injectable()
export class CustomerCommercialSummaryService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly objectMetadataService: ObjectMetadataService,
  ) {}

  async refreshCustomerCommercialSummary({
    workspaceId,
    input,
  }: {
    workspaceId: string;
    input: RefreshCustomerCommercialSummaryInput;
  }): Promise<RefreshCustomerCommercialSummaryResultDTO> {
    const customerId = input.customerId.trim();

    await Promise.all([
      this.assertWorkspaceObject(workspaceId, 'company'),
      this.assertWorkspaceObject(workspaceId, 'opportunity'),
    ]);

    const authContext = buildSystemAuthContext(workspaceId);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const companyRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceCompanyRecord>(
          workspaceId,
          'company',
          { shouldBypassPermissionChecks: true },
        );
      const opportunityRepository =
        await this.globalWorkspaceOrmManager.getRepository<WorkspaceOpportunityRecord>(
          workspaceId,
          'opportunity',
          { shouldBypassPermissionChecks: true },
        );
      const customer = await companyRepository.findOne({
        where: {
          id: customerId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer was not found.');
      }

      const opportunities = await opportunityRepository.find({
        where: {
          companyId: customerId,
        },
      });
      const wonOpportunities = opportunities.filter(isWonOpportunity);
      const totalWonAmount = wonOpportunities.reduce(
        (totalAmount, opportunity) => totalAmount + getAmountValue(opportunity.amount),
        0,
      );
      const wonDates = wonOpportunities
        .map((opportunity) => normalizeDateString(opportunity.closeDate))
        .filter((value): value is string => value !== null)
        .sort();
      const lastWonAt =
        wonDates.length > 0 ? wonDates[wonDates.length - 1] : null;

      await companyRepository.update(
        customerId,
        {
          lastWonAt,
          totalWonAmount,
        } as unknown as QueryDeepPartialEntity<WorkspaceCompanyRecord>,
      );

      return {
        customerId,
        lastWonAt,
        opportunityCount: opportunities.length,
        totalWonAmount,
      };
    }, authContext);
  }

  private async assertWorkspaceObject(
    workspaceId: string,
    objectNameSingular: string,
  ) {
    const objectMetadata = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      {
        where: {
          nameSingular: objectNameSingular,
        },
      },
    );

    if (!objectMetadata) {
      throw new BadRequestException(
        `Commercial summary requires ${objectNameSingular} object.`,
      );
    }
  }
}
