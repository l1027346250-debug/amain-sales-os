import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerMergeService } from 'src/engine/core-modules/customer/customer-merge.service';
import {
  MergeCustomersInput,
  MergeCustomersResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-merge.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => MergeCustomersResultDTO)
export class CustomerMergeResolver {
  constructor(private readonly customerMergeService: CustomerMergeService) {}

  @Mutation(() => MergeCustomersResultDTO)
  async mergeCustomers(
    @Args('input') input: MergeCustomersInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerMergeService.mergeCustomers({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }
}
