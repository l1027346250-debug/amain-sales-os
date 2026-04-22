import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerOperationHistoryService } from 'src/engine/core-modules/customer/customer-operation-history.service';
import {
  CustomerConfigAggregateDTO,
  LogCustomerConfigChangeInput,
} from 'src/engine/core-modules/customer/dto/customer-config.dto';
import { CustomerConfigService } from 'src/engine/core-modules/customer/customer-config.service';
import {
  CustomerOperationHistoryDTO,
  CustomerOperationHistoryItemDTO,
} from 'src/engine/core-modules/customer/dto/customer-operation-history.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerConfigAggregateDTO)
export class CustomerConfigResolver {
  constructor(
    private readonly customerConfigService: CustomerConfigService,
    private readonly customerOperationHistoryService: CustomerOperationHistoryService,
  ) {}

  @Query(() => CustomerConfigAggregateDTO)
  async customerConfig(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.customerConfigService.getCustomerConfig(workspace.id);
  }

  @Query(() => CustomerOperationHistoryDTO)
  async customerConfigOperationHistory(
    @Args('limit', { type: () => Int, nullable: true })
    limit: number | undefined,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerOperationHistoryService.getCustomerConfigOperationHistory(
      workspace.id,
      limit,
    );
  }

  @Mutation(() => CustomerOperationHistoryItemDTO)
  async logCustomerConfigChange(
    @Args('input') input: LogCustomerConfigChangeInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerOperationHistoryService.logCustomerConfigChange({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }
}
