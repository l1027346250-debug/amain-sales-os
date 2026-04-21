import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerTimelineService } from 'src/engine/core-modules/customer/customer-timeline.service';
import {
  CreateCustomerFollowUpInput,
  CreateCustomerFollowUpResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-follow-up.dto';
import {
  CustomerTimelineArgs,
  CustomerTimelineDTO,
} from 'src/engine/core-modules/customer/dto/customer-timeline.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerTimelineDTO)
export class CustomerTimelineResolver {
  constructor(private readonly customerTimelineService: CustomerTimelineService) {}

  @Query(() => CustomerTimelineDTO)
  async customerTimeline(
    @Args() args: CustomerTimelineArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerTimelineService.getCustomerTimeline(workspace.id, args);
  }

  @Mutation(() => CreateCustomerFollowUpResultDTO)
  async createCustomerFollowUp(
    @Args('input') input: CreateCustomerFollowUpInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerTimelineService.createCustomerFollowUp({
      workspaceId: workspace.id,
      workspaceMemberId,
      input,
    });
  }
}
