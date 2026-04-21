import { Injectable } from '@nestjs/common';

import {
  CustomerPublicPoolListArgs,
  CustomerPublicPoolListDTO,
} from 'src/engine/core-modules/customer/dto/customer-public-pool-list.dto';
import { CustomerWorkspaceListService } from 'src/engine/core-modules/customer/customer-workspace-list.service';

const PUBLIC_POOL_STATE_VALUE = 'PUBLIC_POOL';

@Injectable()
export class CustomerPublicPoolListService {
  constructor(
    private readonly customerWorkspaceListService: CustomerWorkspaceListService,
  ) {}

  async getCustomerPublicPoolList(
    workspaceId: string,
    args: CustomerPublicPoolListArgs,
  ): Promise<CustomerPublicPoolListDTO> {
    const workspaceList =
      await this.customerWorkspaceListService.getCustomerWorkspaceList(workspaceId, {
        searchTerm: args.searchTerm,
        stageValue: args.stageValue,
        sourceValue: args.sourceValue,
        tagValue: args.tagValue,
        publicPoolStateValue: PUBLIC_POOL_STATE_VALUE,
        limit: args.limit,
      });

    const publicPoolGroupValue = args.publicPoolGroupValue;
    const records = publicPoolGroupValue
      ? workspaceList.records.filter((record) =>
          this.matchesPublicPoolGroup(record.publicPoolGroup, publicPoolGroupValue),
        )
      : workspaceList.records;

    return {
      records,
      totalCount: records.length,
      stageSummary: workspaceList.stageSummary,
      groupSummary: workspaceList.groupSummary,
      sourceSummary: workspaceList.sourceSummary,
      tagSummary: workspaceList.tagSummary,
    };
  }

  private matchesPublicPoolGroup(value: unknown, expectedValue: string) {
    if (typeof value === 'string') {
      return value === expectedValue;
    }

    if (!value || typeof value !== 'object') {
      return false;
    }

    const selectValue = (value as { value?: unknown; label?: unknown }).value;
    const selectLabel = (value as { value?: unknown; label?: unknown }).label;

    return selectValue === expectedValue || selectLabel === expectedValue;
  }
}
