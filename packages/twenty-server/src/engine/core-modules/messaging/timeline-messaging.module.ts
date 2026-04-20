import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DevelopmentEmailModule } from 'src/engine/core-modules/development-email/development-email.module';
import { TradeCrmMailThreadTagEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-tag.entity';
import { TradeCrmMailThreadStateEntity } from 'src/engine/core-modules/messaging/entities/trade-crm-mail-thread-state.entity';
import { DevelopmentEmailWorkspaceService } from 'src/engine/core-modules/messaging/services/development-email-workspace.service';
import { GetMessagesService } from 'src/engine/core-modules/messaging/services/get-messages.service';
import { TimelineMessagingService } from 'src/engine/core-modules/messaging/services/timeline-messaging.service';
import { TimelineMessagingResolver } from 'src/engine/core-modules/messaging/timeline-messaging.resolver';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceDataSourceModule } from 'src/engine/workspace-datasource/workspace-datasource.module';
import { ConnectedAccountModule } from 'src/modules/connected-account/connected-account.module';
import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradeCrmMailThreadStateEntity,
      TradeCrmMailThreadTagEntity,
    ]),
    WorkspaceDataSourceModule,
    UserModule,
    ConnectedAccountModule,
    DevelopmentEmailModule,
    FeatureFlagModule,
    PermissionsModule,
  ],
  exports: [],
  providers: [
    TimelineMessagingResolver,
    TimelineMessagingService,
    DevelopmentEmailWorkspaceService,
    GetMessagesService,
  ],
})
export class TimelineMessagingModule {}
