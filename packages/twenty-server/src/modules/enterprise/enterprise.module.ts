import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeORMModule } from 'src/database/typeorm/typeorm.module';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { EnterpriseConfigAuditLogEntity } from 'src/modules/enterprise/audit/enterprise-config-audit-log.entity';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
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

@Module({
  imports: [
    TypeORMModule,
    TypeOrmModule.forFeature([
      ObjectMetadataEntity,
      FieldMetadataEntity,
      EnterpriseEntityBindingEntity,
      EnterpriseFieldDefinitionEntity,
      EnterpriseFieldOptionEntity,
      EnterpriseFieldLayoutConfigEntity,
      EnterpriseFieldValueEntity,
      EnterpriseConfigAuditLogEntity,
    ]),
  ],
  controllers: [
    EnterpriseEntityBindingController,
    EnterpriseFieldDefinitionController,
    EnterpriseFieldLayoutController,
    EnterpriseFieldValueController,
  ],
  providers: [
    EnterpriseEntityBindingService,
    EnterpriseConfigAuditService,
    EnterpriseFieldOptionService,
    EnterpriseMetadataProjectionService,
    EnterpriseFieldDefinitionService,
    EnterpriseFieldLayoutService,
    EnterpriseFieldValueService,
  ],
})
export class EnterpriseManagementModule {}
