import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerRecordMutationService } from 'src/engine/core-modules/customer/customer-record-mutation.service';
import {
  CreateCustomerContactInput,
  CreateCustomerInput,
  CustomerRecordMutationResultDTO,
  UpdateCustomerContactInput,
  UpdateCustomerInput,
} from 'src/engine/core-modules/customer/dto/customer-record-mutation.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerRecordMutationResultDTO)
export class CustomerRecordMutationResolver {
  constructor(
    private readonly customerRecordMutationService: CustomerRecordMutationService,
  ) {}

  @Mutation(() => CustomerRecordMutationResultDTO)
  async createCustomer(
    @Args('input') input: CreateCustomerInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerRecordMutationService.createCustomer({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }

  @Mutation(() => CustomerRecordMutationResultDTO)
  async updateCustomer(
    @Args('input') input: UpdateCustomerInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerRecordMutationService.updateCustomer({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }

  @Mutation(() => CustomerRecordMutationResultDTO)
  async createCustomerContact(
    @Args('input') input: CreateCustomerContactInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerRecordMutationService.createCustomerContact({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }

  @Mutation(() => CustomerRecordMutationResultDTO)
  async updateCustomerContact(
    @Args('input') input: UpdateCustomerContactInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerRecordMutationService.updateCustomerContact({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }
}
