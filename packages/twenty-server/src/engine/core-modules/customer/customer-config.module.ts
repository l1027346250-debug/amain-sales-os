import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomerAiInsightResolver } from 'src/engine/core-modules/customer/customer-ai-insight.resolver';
import { CustomerAiInsightService } from 'src/engine/core-modules/customer/customer-ai-insight.service';
import { CustomerConfigResolver } from 'src/engine/core-modules/customer/customer-config.resolver';
import { CustomerConfigService } from 'src/engine/core-modules/customer/customer-config.service';
import { CustomerCommercialSummaryResolver } from 'src/engine/core-modules/customer/customer-commercial-summary.resolver';
import { CustomerCommercialSummaryService } from 'src/engine/core-modules/customer/customer-commercial-summary.service';
import { CustomerDedupSearchResolver } from 'src/engine/core-modules/customer/customer-dedup-search.resolver';
import { CustomerDedupSearchService } from 'src/engine/core-modules/customer/customer-dedup-search.service';
import { CustomerDetailResolver } from 'src/engine/core-modules/customer/customer-detail.resolver';
import { CustomerDetailService } from 'src/engine/core-modules/customer/customer-detail.service';
import { CustomerDocumentResolver } from 'src/engine/core-modules/customer/customer-document.resolver';
import { CustomerDocumentService } from 'src/engine/core-modules/customer/customer-document.service';
import { CustomerImportJobResolver } from 'src/engine/core-modules/customer/customer-import-job.resolver';
import { CustomerImportJobService } from 'src/engine/core-modules/customer/customer-import-job.service';
import { CustomerLeadConversionResolver } from 'src/engine/core-modules/customer/customer-lead-conversion.resolver';
import { CustomerLeadConversionService } from 'src/engine/core-modules/customer/customer-lead-conversion.service';
import { CustomerMergeResolver } from 'src/engine/core-modules/customer/customer-merge.resolver';
import { CustomerMergeService } from 'src/engine/core-modules/customer/customer-merge.service';
import { CustomerOperationHistoryResolver } from 'src/engine/core-modules/customer/customer-operation-history.resolver';
import { CustomerOperationHistoryService } from 'src/engine/core-modules/customer/customer-operation-history.service';
import { CustomerPublicPoolActionResolver } from 'src/engine/core-modules/customer/customer-public-pool-action.resolver';
import { CustomerPublicPoolActionService } from 'src/engine/core-modules/customer/customer-public-pool-action.service';
import { CustomerPublicPoolListResolver } from 'src/engine/core-modules/customer/customer-public-pool-list.resolver';
import { CustomerPublicPoolListService } from 'src/engine/core-modules/customer/customer-public-pool-list.service';
import { CustomerPublicPoolRuleExecutionResolver } from 'src/engine/core-modules/customer/customer-public-pool-rule-execution.resolver';
import { CustomerPublicPoolRuleExecutionService } from 'src/engine/core-modules/customer/customer-public-pool-rule-execution.service';
import { CustomerRecordMutationResolver } from 'src/engine/core-modules/customer/customer-record-mutation.resolver';
import { CustomerRecordMutationService } from 'src/engine/core-modules/customer/customer-record-mutation.service';
import { CustomerTimelineResolver } from 'src/engine/core-modules/customer/customer-timeline.resolver';
import { CustomerTimelineService } from 'src/engine/core-modules/customer/customer-timeline.service';
import { CustomerWorkspaceListResolver } from 'src/engine/core-modules/customer/customer-workspace-list.resolver';
import { CustomerWorkspaceListService } from 'src/engine/core-modules/customer/customer-workspace-list.service';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { EnterpriseEntityBindingEntity } from 'src/modules/enterprise/entity-binding/enterprise-entity-binding.entity';
import { EnterpriseFieldDefinitionEntity } from 'src/modules/enterprise/field-definition/enterprise-field-definition.entity';
import { EnterpriseFieldValueEntity } from 'src/modules/enterprise/field-value/enterprise-field-value.entity';

@Module({
  imports: [
    ObjectMetadataModule,
    TypeOrmModule.forFeature([
      EnterpriseEntityBindingEntity,
      EnterpriseFieldDefinitionEntity,
      EnterpriseFieldValueEntity,
    ]),
  ],
  providers: [
    CustomerAiInsightResolver,
    CustomerAiInsightService,
    CustomerConfigResolver,
    CustomerConfigService,
    CustomerCommercialSummaryResolver,
    CustomerCommercialSummaryService,
    CustomerDedupSearchResolver,
    CustomerDedupSearchService,
    CustomerDetailResolver,
    CustomerDetailService,
    CustomerDocumentResolver,
    CustomerDocumentService,
    CustomerImportJobResolver,
    CustomerImportJobService,
    CustomerLeadConversionResolver,
    CustomerLeadConversionService,
    CustomerMergeResolver,
    CustomerMergeService,
    CustomerOperationHistoryResolver,
    CustomerOperationHistoryService,
    CustomerPublicPoolActionResolver,
    CustomerPublicPoolActionService,
    CustomerPublicPoolListResolver,
    CustomerPublicPoolListService,
    CustomerPublicPoolRuleExecutionResolver,
    CustomerPublicPoolRuleExecutionService,
    CustomerRecordMutationResolver,
    CustomerRecordMutationService,
    CustomerTimelineResolver,
    CustomerTimelineService,
    CustomerWorkspaceListResolver,
    CustomerWorkspaceListService,
  ],
})
export class CustomerConfigModule {}
