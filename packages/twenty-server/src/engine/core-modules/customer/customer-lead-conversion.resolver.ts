import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerLeadConversionService } from 'src/engine/core-modules/customer/customer-lead-conversion.service';
import {
  ConvertLeadToCustomerInput,
  ConvertLeadToCustomerResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-lead-conversion.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => ConvertLeadToCustomerResultDTO)
export class CustomerLeadConversionResolver {
  constructor(
    private readonly customerLeadConversionService: CustomerLeadConversionService,
  ) {}

  @Mutation(() => ConvertLeadToCustomerResultDTO)
  async convertLeadToCustomer(
    @Args('input') input: ConvertLeadToCustomerInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerLeadConversionService.convertLeadToCustomer({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }
}
