import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerPublicPoolActionService } from 'src/engine/core-modules/customer/customer-public-pool-action.service';
import {
  ClaimPublicPoolCustomerInput,
  CustomerPublicPoolActionResultDTO,
  MoveCustomersToPublicPoolInput,
} from 'src/engine/core-modules/customer/dto/customer-public-pool-action.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerPublicPoolActionResultDTO)
export class CustomerPublicPoolActionResolver {
  constructor(
    private readonly customerPublicPoolActionService: CustomerPublicPoolActionService,
  ) {}

  @Mutation(() => CustomerPublicPoolActionResultDTO)
  async claimPublicPoolCustomer(
    @Args('input') input: ClaimPublicPoolCustomerInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerPublicPoolActionService.claimPublicPoolCustomer({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }

  @Mutation(() => CustomerPublicPoolActionResultDTO)
  async moveCustomersToPublicPool(
    @Args('input') input: MoveCustomersToPublicPoolInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerPublicPoolActionService.moveCustomersToPublicPool({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }
}
