import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeORMModule } from 'src/database/typeorm/typeorm.module';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { FileModule } from 'src/engine/core-modules/file/file.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { RoleTargetEntity } from 'src/engine/metadata-modules/role-target/role-target.entity';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { EnterpriseConfigAuditLogEntity } from 'src/modules/enterprise/audit/enterprise-config-audit-log.entity';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseCustomerExportExpiryCleanupCronCommand } from 'src/modules/enterprise/customer-export/commands/enterprise-customer-export-expiry-cleanup.cron.command';
import { EnterpriseCustomerExportController } from 'src/modules/enterprise/customer-export/controllers/enterprise-customer-export.controller';
import { EnterpriseCustomerExportJobEntity } from 'src/modules/enterprise/customer-export/enterprise-customer-export-job.entity';
import {
  EnterpriseCustomerExportExpiryCleanupCronJob,
  EnterpriseCustomerExportExpiryCleanupJob,
} from 'src/modules/enterprise/customer-export/jobs/enterprise-customer-export-expiry-cleanup.job';
import { EnterpriseCustomerExportQueueJob } from 'src/modules/enterprise/customer-export/jobs/enterprise-customer-export.job';
import { EnterpriseCustomerExportService } from 'src/modules/enterprise/customer-export/services/enterprise-customer-export.service';
import { EnterpriseEntityBindingController } from 'src/modules/enterprise/entity-binding/controllers/enterprise-entity-binding.controller';
import { EnterpriseEntityBindingEntity } from 'src/modules/enterprise/entity-binding/enterprise-entity-binding.entity';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';
import { EnterpriseFieldDefinitionController } from 'src/modules/enterprise/field-definition/controllers/enterprise-field-definition.controller';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldOptionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-option.entity';
import { EnterpriseFieldDefinitionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-definition.service';
import { EnterpriseFieldOptionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-option.service';
import { EnterpriseFieldLayoutController } from 'src/modules/enterprise/field-layout/controllers/enterprise-field-layout.controller';
import { EnterpriseFieldLayoutConfigEntity } from 'src/modules/enterprise/field-layout/enterprise-field-layout-config.entity';
import { EnterpriseFieldLayoutService } from 'src/modules/enterprise/field-layout/services/enterprise-field-layout.service';
import { EnterpriseFieldValueController } from 'src/modules/enterprise/field-value/controllers/enterprise-field-value.controller';
import { EnterpriseFieldValueEntity } from 'src/modules/enterprise/field-value/enterprise-field-value.entity';
import { EnterpriseFieldValueService } from 'src/modules/enterprise/field-value/services/enterprise-field-value.service';
import { EnterpriseIndependentStationController } from 'src/modules/enterprise/independent-station/controllers/enterprise-independent-station.controller';
import { EnterpriseIndependentStationWebhookController } from 'src/modules/enterprise/independent-station/controllers/enterprise-independent-station-webhook.controller';
import { EnterpriseInquiryAssignmentRuleEntity } from 'src/modules/enterprise/independent-station/enterprise-inquiry-assignment-rule.entity';
import { EnterpriseInquiryFormMappingEntity } from 'src/modules/enterprise/independent-station/enterprise-inquiry-form-mapping.entity';
import { EnterpriseWebsiteBindingEntity } from 'src/modules/enterprise/independent-station/enterprise-website-binding.entity';
import { EnterpriseWebsiteInquiryEntity } from 'src/modules/enterprise/independent-station/enterprise-website-inquiry.entity';
import { EnterpriseIndependentStationService } from 'src/modules/enterprise/independent-station/services/enterprise-independent-station.service';
import { EnterprisePermissionController } from 'src/modules/enterprise/permissions/controllers/enterprise-permission.controller';
import { EnterpriseRolePermissionEntity } from 'src/modules/enterprise/permissions/enterprise-role-permission.entity';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { EnterpriseMetadataProjectionService } from 'src/modules/enterprise/projection/services/enterprise-metadata-projection.service';
import { EnterpriseRecycleController } from 'src/modules/enterprise/recycle/controllers/enterprise-recycle.controller';
import { EnterpriseRecycleRecordEntity } from 'src/modules/enterprise/recycle/enterprise-recycle-record.entity';
import { EnterpriseRecycleService } from 'src/modules/enterprise/recycle/services/enterprise-recycle.service';
import { EnterpriseReportTemplateController } from 'src/modules/enterprise/report-template/controllers/enterprise-report-template.controller';
import { EnterpriseReportTemplateVersionEntity } from 'src/modules/enterprise/report-template/enterprise-report-template-version.entity';
import { EnterpriseReportTemplateEntity } from 'src/modules/enterprise/report-template/enterprise-report-template.entity';
import { EnterpriseReportTemplateService } from 'src/modules/enterprise/report-template/services/enterprise-report-template.service';
import { EnterpriseSalesPlaybookController } from 'src/modules/enterprise/sales-playbook/controllers/enterprise-sales-playbook.controller';
import { EnterpriseSalesPlaybookItemEntity } from 'src/modules/enterprise/sales-playbook/enterprise-sales-playbook-item.entity';
import { EnterpriseSalesPlaybookStageEntity } from 'src/modules/enterprise/sales-playbook/enterprise-sales-playbook-stage.entity';
import { EnterpriseSalesPlaybookEntity } from 'src/modules/enterprise/sales-playbook/enterprise-sales-playbook.entity';
import { EnterpriseSalesPlaybookService } from 'src/modules/enterprise/sales-playbook/services/enterprise-sales-playbook.service';
import { EnterpriseSourceConvertController } from 'src/modules/enterprise/source-convert/controllers/enterprise-source-convert.controller';
import { EnterpriseSourceBlacklistRuleEntity } from 'src/modules/enterprise/source-convert/enterprise-source-blacklist-rule.entity';
import { EnterpriseSourceChannelEntity } from 'src/modules/enterprise/source-convert/enterprise-source-channel.entity';
import { EnterpriseSourceConvertRuleEntity } from 'src/modules/enterprise/source-convert/enterprise-source-convert-rule.entity';
import { EnterpriseSourceConvertService } from 'src/modules/enterprise/source-convert/services/enterprise-source-convert.service';

@Module({
  imports: [
    TypeORMModule,
    ApplicationModule,
    AuthModule,
    FileModule,
    PermissionsModule,
    WorkspaceCacheStorageModule,
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      ApplicationEntity,
      RoleEntity,
      RoleTargetEntity,
      ObjectMetadataEntity,
      FieldMetadataEntity,
      EnterpriseEntityBindingEntity,
      EnterpriseFieldDefinitionEntity,
      EnterpriseFieldOptionEntity,
      EnterpriseFieldLayoutConfigEntity,
      EnterpriseFieldValueEntity,
      EnterpriseCustomerExportJobEntity,
      EnterpriseRecycleRecordEntity,
      EnterpriseReportTemplateEntity,
      EnterpriseReportTemplateVersionEntity,
      EnterpriseSourceChannelEntity,
      EnterpriseSourceConvertRuleEntity,
      EnterpriseSourceBlacklistRuleEntity,
      EnterpriseWebsiteBindingEntity,
      EnterpriseInquiryFormMappingEntity,
      EnterpriseInquiryAssignmentRuleEntity,
      EnterpriseWebsiteInquiryEntity,
      EnterpriseSalesPlaybookEntity,
      EnterpriseSalesPlaybookStageEntity,
      EnterpriseSalesPlaybookItemEntity,
      EnterpriseRolePermissionEntity,
      EnterpriseConfigAuditLogEntity,
    ]),
  ],
  controllers: [
    EnterpriseEntityBindingController,
    EnterpriseFieldDefinitionController,
    EnterpriseFieldLayoutController,
    EnterpriseFieldValueController,
    EnterpriseCustomerExportController,
    EnterpriseRecycleController,
    EnterpriseReportTemplateController,
    EnterpriseSourceConvertController,
    EnterpriseIndependentStationController,
    EnterpriseIndependentStationWebhookController,
    EnterpriseSalesPlaybookController,
    EnterprisePermissionController,
  ],
  providers: [
    EnterpriseEntityBindingService,
    EnterpriseConfigAuditService,
    EnterprisePermissionService,
    EnterpriseCustomerExportService,
    EnterpriseCustomerExportExpiryCleanupJob,
    EnterpriseCustomerExportExpiryCleanupCronJob,
    EnterpriseCustomerExportExpiryCleanupCronCommand,
    EnterpriseCustomerExportQueueJob,
    EnterpriseRecycleService,
    EnterpriseFieldOptionService,
    EnterpriseMetadataProjectionService,
    EnterpriseFieldDefinitionService,
    EnterpriseFieldLayoutService,
    EnterpriseFieldValueService,
    EnterpriseReportTemplateService,
    EnterpriseSourceConvertService,
    EnterpriseIndependentStationService,
    EnterpriseSalesPlaybookService,
  ],
})
export class EnterpriseManagementModule {}
