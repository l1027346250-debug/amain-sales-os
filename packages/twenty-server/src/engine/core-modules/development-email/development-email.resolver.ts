import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { PermissionFlagType } from 'twenty-shared/constants';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CreateDevelopmentEmailAudienceInput } from 'src/engine/core-modules/development-email/dtos/create-development-email-audience.input';
import { CreateDevelopmentEmailCampaignInput } from 'src/engine/core-modules/development-email/dtos/create-development-email-campaign.input';
import { CreateDevelopmentEmailTemplateInput } from 'src/engine/core-modules/development-email/dtos/create-development-email-template.input';
import { DevelopmentEmailAnalyticsDTO } from 'src/engine/core-modules/development-email/dtos/development-email-analytics.dto';
import { DevelopmentEmailReportExportDTO } from 'src/engine/core-modules/development-email/dtos/development-email-report-export.dto';
import { DevelopmentEmailReportDTO } from 'src/engine/core-modules/development-email/dtos/development-email-report.dto';
import { DevelopmentEmailSendJobSummaryDTO } from 'src/engine/core-modules/development-email/dtos/development-email-send-job-summary.dto';
import { DevelopmentEmailTrackingLinksDTO } from 'src/engine/core-modules/development-email/dtos/development-email-tracking-links.dto';
import { ExecuteDevelopmentEmailSendJobInput } from 'src/engine/core-modules/development-email/dtos/execute-development-email-send-job.input';
import { GenerateDevelopmentEmailTrackingLinksInput } from 'src/engine/core-modules/development-email/dtos/generate-development-email-tracking-links.input';
import { QueueDevelopmentEmailCampaignInput } from 'src/engine/core-modules/development-email/dtos/queue-development-email-campaign.input';
import { RecordDevelopmentEmailBounceEventInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-bounce-event.input';
import { RecordDevelopmentEmailEventInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-event.input';
import { RecordDevelopmentEmailUnsubscribeInput } from 'src/engine/core-modules/development-email/dtos/record-development-email-unsubscribe.input';
import { StartDevelopmentEmailSendJobInput } from 'src/engine/core-modules/development-email/dtos/start-development-email-send-job.input';
import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailBounceEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-bounce-event.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-event.entity';
import { DevelopmentEmailSendJobEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-job.entity';
import { DevelopmentEmailSendTaskEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-task.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { DevelopmentEmailUnsubscribeEntity } from 'src/engine/core-modules/development-email/entities/development-email-unsubscribe.entity';
import { DevelopmentEmailService } from 'src/engine/core-modules/development-email/services/development-email.service';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(
  WorkspaceAuthGuard,
  SettingsPermissionGuard(PermissionFlagType.WORKSPACE),
)
@UsePipes(ResolverValidationPipe)
@CoreResolver()
export class DevelopmentEmailResolver {
  constructor(
    private readonly developmentEmailService: DevelopmentEmailService,
  ) {}

  @Query(() => [DevelopmentEmailAudienceEntity])
  async getDevelopmentEmailAudiences(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailAudienceEntity[]> {
    return this.developmentEmailService.getAudiences(currentWorkspace);
  }

  @Mutation(() => DevelopmentEmailAudienceEntity)
  async createDevelopmentEmailAudience(
    @Args('input') input: CreateDevelopmentEmailAudienceInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailAudienceEntity> {
    return this.developmentEmailService.createAudience(currentWorkspace, input);
  }

  @Query(() => [DevelopmentEmailTemplateEntity])
  async getDevelopmentEmailTemplates(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailTemplateEntity[]> {
    return this.developmentEmailService.getTemplates(currentWorkspace);
  }

  @Mutation(() => DevelopmentEmailTemplateEntity)
  async createDevelopmentEmailTemplate(
    @Args('input') input: CreateDevelopmentEmailTemplateInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailTemplateEntity> {
    return this.developmentEmailService.createTemplate(currentWorkspace, input);
  }

  @Query(() => [DevelopmentEmailCampaignEntity])
  async getDevelopmentEmailCampaigns(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailCampaignEntity[]> {
    return this.developmentEmailService.getCampaigns(currentWorkspace);
  }

  @Query(() => [DevelopmentEmailSendJobEntity])
  async getDevelopmentEmailSendJobs(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendJobEntity[]> {
    return this.developmentEmailService.getSendJobs(currentWorkspace);
  }

  @Query(() => DevelopmentEmailSendJobSummaryDTO)
  async getDevelopmentEmailSendJobSummary(
    @Args('sendJobId') sendJobId: string,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendJobSummaryDTO> {
    return this.developmentEmailService.getSendJobSummary(
      currentWorkspace,
      sendJobId,
    );
  }

  @Query(() => [DevelopmentEmailSendTaskEntity])
  async getDevelopmentEmailSendTasks(
    @Args('sendJobId', { nullable: true }) sendJobId: string | null,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendTaskEntity[]> {
    return this.developmentEmailService.getSendTasks(
      currentWorkspace,
      sendJobId ?? undefined,
    );
  }

  @Query(() => [DevelopmentEmailBounceEventEntity])
  async getDevelopmentEmailBounceEvents(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailBounceEventEntity[]> {
    return this.developmentEmailService.getBounceEvents(currentWorkspace);
  }

  @Query(() => [DevelopmentEmailUnsubscribeEntity])
  async getDevelopmentEmailUnsubscribes(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailUnsubscribeEntity[]> {
    return this.developmentEmailService.getUnsubscribes(currentWorkspace);
  }

  @Query(() => DevelopmentEmailAnalyticsDTO)
  async getDevelopmentEmailAnalytics(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailAnalyticsDTO> {
    return this.developmentEmailService.getAnalytics(currentWorkspace);
  }

  @Query(() => DevelopmentEmailReportDTO)
  async getDevelopmentEmailReports(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailReportDTO> {
    return this.developmentEmailService.getReports(currentWorkspace);
  }

  @Query(() => DevelopmentEmailReportExportDTO)
  async getDevelopmentEmailReportExport(
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailReportExportDTO> {
    return this.developmentEmailService.getReportExport(currentWorkspace);
  }

  @Query(() => DevelopmentEmailTrackingLinksDTO)
  async getDevelopmentEmailTrackingLinks(
    @Args('input') input: GenerateDevelopmentEmailTrackingLinksInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailTrackingLinksDTO> {
    return this.developmentEmailService.generateTrackingLinks(
      currentWorkspace,
      input,
    );
  }

  @Mutation(() => DevelopmentEmailCampaignEntity)
  async createDevelopmentEmailCampaign(
    @Args('input') input: CreateDevelopmentEmailCampaignInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailCampaignEntity> {
    return this.developmentEmailService.createCampaign(currentWorkspace, input);
  }

  @Mutation(() => DevelopmentEmailSendJobEntity)
  async queueDevelopmentEmailCampaign(
    @Args('input') input: QueueDevelopmentEmailCampaignInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendJobEntity> {
    return this.developmentEmailService.queueCampaign(currentWorkspace, input);
  }

  @Mutation(() => DevelopmentEmailSendJobEntity)
  async startDevelopmentEmailSendJob(
    @Args('input') input: StartDevelopmentEmailSendJobInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendJobEntity> {
    return this.developmentEmailService.startSendJob(currentWorkspace, input);
  }

  @Mutation(() => DevelopmentEmailSendJobEntity)
  async executeDevelopmentEmailSendJob(
    @Args('input') input: ExecuteDevelopmentEmailSendJobInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailSendJobEntity> {
    return this.developmentEmailService.executeSendJob(currentWorkspace, input);
  }

  @Mutation(() => DevelopmentEmailBounceEventEntity)
  async recordDevelopmentEmailBounceEvent(
    @Args('input') input: RecordDevelopmentEmailBounceEventInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailBounceEventEntity> {
    return this.developmentEmailService.recordBounceEvent(
      currentWorkspace,
      input,
    );
  }

  @Mutation(() => DevelopmentEmailEventEntity)
  async recordDevelopmentEmailEvent(
    @Args('input') input: RecordDevelopmentEmailEventInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailEventEntity> {
    return this.developmentEmailService.recordEvent(currentWorkspace, input);
  }

  @Mutation(() => DevelopmentEmailUnsubscribeEntity)
  async recordDevelopmentEmailUnsubscribe(
    @Args('input') input: RecordDevelopmentEmailUnsubscribeInput,
    @AuthWorkspace() currentWorkspace: WorkspaceEntity,
  ): Promise<DevelopmentEmailUnsubscribeEntity> {
    return this.developmentEmailService.recordUnsubscribe(
      currentWorkspace,
      input,
    );
  }
}
