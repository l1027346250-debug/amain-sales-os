import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeORMModule } from 'src/database/typeorm/typeorm.module';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { FileModule } from 'src/engine/core-modules/file/file.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
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
import { EnterpriseMetadataProjectionService } from 'src/modules/enterprise/projection/services/enterprise-metadata-projection.service';
import { EnterpriseReportTemplateController } from 'src/modules/enterprise/report-template/controllers/enterprise-report-template.controller';
import { EnterpriseReportTemplateVersionEntity } from 'src/modules/enterprise/report-template/enterprise-report-template-version.entity';
import { EnterpriseReportTemplateEntity } from 'src/modules/enterprise/report-template/enterprise-report-template.entity';
import { EnterpriseReportTemplateService } from 'src/modules/enterprise/report-template/services/enterprise-report-template.service';

@Module({
  imports: [
    TypeORMModule,
    ApplicationModule,
    AuthModule,
    FileModule,
    WorkspaceCacheStorageModule,
    TypeOrmModule.forFeature([
      WorkspaceEntity,
      ObjectMetadataEntity,
      FieldMetadataEntity,
      EnterpriseEntityBindingEntity,
      EnterpriseFieldDefinitionEntity,
      EnterpriseFieldOptionEntity,
      EnterpriseFieldLayoutConfigEntity,
      EnterpriseFieldValueEntity,
      EnterpriseCustomerExportJobEntity,
      EnterpriseReportTemplateEntity,
      EnterpriseReportTemplateVersionEntity,
      EnterpriseConfigAuditLogEntity,
    ]),
  ],
  controllers: [
    EnterpriseEntityBindingController,
    EnterpriseFieldDefinitionController,
    EnterpriseFieldLayoutController,
    EnterpriseFieldValueController,
    EnterpriseCustomerExportController,
    EnterpriseReportTemplateController,
  ],
  providers: [
    EnterpriseEntityBindingService,
    EnterpriseConfigAuditService,
    EnterpriseCustomerExportService,
    EnterpriseCustomerExportExpiryCleanupJob,
    EnterpriseCustomerExportExpiryCleanupCronJob,
    EnterpriseCustomerExportExpiryCleanupCronCommand,
    EnterpriseCustomerExportQueueJob,
    EnterpriseFieldOptionService,
    EnterpriseMetadataProjectionService,
    EnterpriseFieldDefinitionService,
    EnterpriseFieldLayoutService,
    EnterpriseFieldValueService,
    EnterpriseReportTemplateService,
  ],
})
export class EnterpriseManagementModule {}


