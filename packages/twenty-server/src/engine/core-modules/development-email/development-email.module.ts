import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeORMModule } from 'src/database/typeorm/typeorm.module';
import { DevelopmentEmailProviderWebhookController } from 'src/engine/core-modules/development-email/controllers/development-email-provider-webhook.controller';
import { DevelopmentEmailTrackingController } from 'src/engine/core-modules/development-email/controllers/development-email-tracking.controller';
import { DevelopmentEmailResolver } from 'src/engine/core-modules/development-email/development-email.resolver';
import { DevelopmentEmailAudienceEntity } from 'src/engine/core-modules/development-email/entities/development-email-audience.entity';
import { DevelopmentEmailBounceEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-bounce-event.entity';
import { DevelopmentEmailCampaignEntity } from 'src/engine/core-modules/development-email/entities/development-email-campaign.entity';
import { DevelopmentEmailEventEntity } from 'src/engine/core-modules/development-email/entities/development-email-event.entity';
import { DevelopmentEmailSendJobEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-job.entity';
import { DevelopmentEmailSendTaskEntity } from 'src/engine/core-modules/development-email/entities/development-email-send-task.entity';
import { DevelopmentEmailTemplateEntity } from 'src/engine/core-modules/development-email/entities/development-email-template.entity';
import { DevelopmentEmailUnsubscribeEntity } from 'src/engine/core-modules/development-email/entities/development-email-unsubscribe.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { DevelopmentEmailProviderExecutorService } from 'src/engine/core-modules/development-email/services/development-email-provider-executor.service';
import { DevelopmentEmailService } from 'src/engine/core-modules/development-email/services/development-email.service';
import { ConnectedAccountDataAccessModule } from 'src/engine/metadata-modules/connected-account/data-access/connected-account-data-access.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { MessagingSmtpDriverModule } from 'src/modules/messaging/message-import-manager/drivers/smtp/messaging-smtp-driver.module';
import { MessagingSendManagerModule } from 'src/modules/messaging/message-outbound-manager/messaging-send-manager.module';

@Module({
  imports: [
    TypeORMModule,
    PermissionsModule,
    ConnectedAccountDataAccessModule,
    MessagingSmtpDriverModule,
    MessagingSendManagerModule,
    TypeOrmModule.forFeature([
      DevelopmentEmailAudienceEntity,
      DevelopmentEmailTemplateEntity,
      DevelopmentEmailCampaignEntity,
      DevelopmentEmailEventEntity,
      DevelopmentEmailSendJobEntity,
      DevelopmentEmailSendTaskEntity,
      DevelopmentEmailBounceEventEntity,
      DevelopmentEmailUnsubscribeEntity,
      ConnectedAccountEntity,
    ]),
  ],
  controllers: [
    DevelopmentEmailTrackingController,
    DevelopmentEmailProviderWebhookController,
  ],
  exports: [TypeOrmModule, DevelopmentEmailService],
  providers: [
    DevelopmentEmailService,
    DevelopmentEmailResolver,
    DevelopmentEmailProviderExecutorService,
  ],
})
export class DevelopmentEmailModule {}
