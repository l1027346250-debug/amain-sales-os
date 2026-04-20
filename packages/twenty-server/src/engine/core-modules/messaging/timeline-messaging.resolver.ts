import { UseGuards } from '@nestjs/common';
import {
  Args,
  ArgsType,
  Field,
  Int,
  Mutation,
  Query,
  registerEnumType,
} from '@nestjs/graphql';

import { Max } from 'class-validator';
import { PermissionFlagType } from 'twenty-shared/constants';
import { MessageDirection } from 'src/modules/messaging/common/enums/message-direction.enum';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { TIMELINE_THREADS_MAX_PAGE_SIZE } from 'src/engine/core-modules/messaging/constants/messaging.constants';
import { DismissReconnectAccountBannerInput } from 'src/engine/core-modules/messaging/dtos/dismiss-reconnect-account-banner.input';
import { UpdateTradeCrmMailThreadTagInput } from 'src/engine/core-modules/messaging/dtos/update-trade-crm-mail-thread-tag.input';
import { UpdateTradeCrmMailThreadStateInput } from 'src/engine/core-modules/messaging/dtos/update-trade-crm-mail-thread-state.input';
import { DevelopmentEmailWorkspaceDTO } from 'src/engine/core-modules/messaging/dtos/development-email-workspace.dto';
import { TimelineCompanyThreadsWithTotalDTO } from 'src/engine/core-modules/messaging/dtos/timeline-company-threads-with-total.dto';
import { TimelineThreadsWithTotalDTO } from 'src/engine/core-modules/messaging/dtos/timeline-threads-with-total.dto';
import { DevelopmentEmailWorkspaceService } from 'src/engine/core-modules/messaging/services/development-email-workspace.service';
import { GetMessagesService } from 'src/engine/core-modules/messaging/services/get-messages.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AccountsToReconnectService } from 'src/modules/connected-account/services/accounts-to-reconnect.service';

registerEnumType(MessageDirection, {
  name: 'MessageDirection',
});

@ArgsType()
class GetTimelineThreadsFromPersonIdArgs {
  @Field(() => UUIDScalarType)
  personId: string;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TIMELINE_THREADS_MAX_PAGE_SIZE)
  pageSize: number;
}

@ArgsType()
class GetTimelineThreadsFromCompanyIdArgs {
  @Field(() => UUIDScalarType)
  companyId: string;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TIMELINE_THREADS_MAX_PAGE_SIZE)
  pageSize: number;
}

@ArgsType()
class GetTimelineThreadsFromOpportunityIdArgs {
  @Field(() => UUIDScalarType)
  opportunityId: string;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TIMELINE_THREADS_MAX_PAGE_SIZE)
  pageSize: number;
}

@ArgsType()
class GetMyInboxThreadsArgs {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TIMELINE_THREADS_MAX_PAGE_SIZE)
  pageSize: number;

  @Field(() => MessageDirection, { nullable: true })
  direction?: MessageDirection;

  @Field(() => String, { nullable: true })
  filter?: string;

  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => String, { nullable: true })
  tag?: string;

  @Field(() => String, { nullable: true })
  receivedAtFrom?: string;

  @Field(() => String, { nullable: true })
  receivedAtTo?: string;
}

@ArgsType()
class GetMyCustomerMailCompaniesArgs {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TIMELINE_THREADS_MAX_PAGE_SIZE)
  pageSize: number;
}

@UseGuards(WorkspaceAuthGuard, UserAuthGuard, CustomPermissionGuard)
@CoreResolver(() => TimelineThreadsWithTotalDTO)
export class TimelineMessagingResolver {
  constructor(
    private readonly getMessagesFromPersonIdsService: GetMessagesService,
    private readonly developmentEmailWorkspaceService: DevelopmentEmailWorkspaceService,
    private readonly userService: UserService,
    private readonly accountsToReconnectService: AccountsToReconnectService,
  ) {}

  @Query(() => TimelineThreadsWithTotalDTO)
  async getTimelineThreadsFromPersonId(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args() { personId, page, pageSize }: GetTimelineThreadsFromPersonIdArgs,
  ) {
    const workspaceMember = await this.userService.loadWorkspaceMember(
      user,
      workspace,
    );

    if (!workspaceMember) {
      return;
    }

    const timelineThreads =
      await this.getMessagesFromPersonIdsService.getMessagesFromPersonIds(
        workspaceMember.id,
        [personId],
        workspace.id,
        page,
        pageSize,
      );

    return timelineThreads;
  }

  @Query(() => TimelineThreadsWithTotalDTO)
  async getTimelineThreadsFromCompanyId(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args() { companyId, page, pageSize }: GetTimelineThreadsFromCompanyIdArgs,
  ) {
    const workspaceMember = await this.userService.loadWorkspaceMember(
      user,
      workspace,
    );

    if (!workspaceMember) {
      return;
    }

    const timelineThreads =
      await this.getMessagesFromPersonIdsService.getMessagesFromCompanyId(
        workspaceMember.id,
        companyId,
        workspace.id,
        page,
        pageSize,
      );

    return timelineThreads;
  }

  @Query(() => TimelineThreadsWithTotalDTO)
  async getTimelineThreadsFromOpportunityId(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args()
    { opportunityId, page, pageSize }: GetTimelineThreadsFromOpportunityIdArgs,
  ) {
    const workspaceMember = await this.userService.loadWorkspaceMember(
      user,
      workspace,
    );

    if (!workspaceMember) {
      return;
    }

    const timelineThreads =
      await this.getMessagesFromPersonIdsService.getMessagesFromOpportunityId(
        workspaceMember.id,
        opportunityId,
        workspace.id,
        page,
        pageSize,
      );

    return timelineThreads;
  }

  @Query(() => TimelineThreadsWithTotalDTO)
  async getMyInboxThreads(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args()
    {
      page,
      pageSize,
      direction,
      filter,
      search,
      tag,
      receivedAtFrom,
      receivedAtTo,
    }: GetMyInboxThreadsArgs,
  ) {
    const workspaceMember = await this.userService.loadWorkspaceMember(
      user,
      workspace,
    );

    if (!workspaceMember) {
      return;
    }

    return this.getMessagesFromPersonIdsService.getMessagesForWorkspaceMember(
      workspaceMember.id,
      workspace.id,
      page,
      pageSize,
      direction,
      filter === 'UNREAD' || filter === 'PENDING' || filter === 'TAGGED'
        ? filter
        : 'ALL',
      search,
      tag,
      receivedAtFrom,
      receivedAtTo,
    );
  }

  @Mutation(() => Boolean)
  async updateTradeCrmMailThreadState(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateTradeCrmMailThreadStateInput,
  ): Promise<boolean> {
    if (!(await this.userService.loadWorkspaceMember(user, workspace))) {
      return false;
    }

    await this.getMessagesFromPersonIdsService.updateTradeCrmMailThreadState(
      workspace.id,
      input.threadId,
      input.isPending,
      input.pendingReason,
    );

    return true;
  }

  @Mutation(() => Boolean)
  async updateTradeCrmMailThreadTag(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('input') input: UpdateTradeCrmMailThreadTagInput,
  ): Promise<boolean> {
    if (!(await this.userService.loadWorkspaceMember(user, workspace))) {
      return false;
    }

    await this.getMessagesFromPersonIdsService.updateTradeCrmMailThreadTag(
      workspace.id,
      input.threadId,
      input.mode,
      input.tag,
    );

    return true;
  }

  @Query(() => TimelineCompanyThreadsWithTotalDTO)
  async getMyCustomerMailCompanies(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args() { page, pageSize }: GetMyCustomerMailCompaniesArgs,
  ) {
    if (!(await this.userService.loadWorkspaceMember(user, workspace))) {
      return;
    }

    return this.getMessagesFromPersonIdsService.getMessagesGroupedByCompany(
      workspace.id,
      page,
      pageSize,
    );
  }

  @Query(() => DevelopmentEmailWorkspaceDTO)
  async getDevelopmentEmailWorkspace(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    if (!(await this.userService.loadWorkspaceMember(user, workspace))) {
      return;
    }

    return this.developmentEmailWorkspaceService.getWorkspace(workspace.id);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.CONNECTED_ACCOUNTS))
  @Mutation(() => Boolean)
  async dismissReconnectAccountBanner(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args() { connectedAccountId }: DismissReconnectAccountBannerInput,
  ): Promise<boolean> {
    await this.accountsToReconnectService.removeAccountToReconnect(
      user.id,
      workspace.id,
      connectedAccountId,
    );

    return true;
  }
}
