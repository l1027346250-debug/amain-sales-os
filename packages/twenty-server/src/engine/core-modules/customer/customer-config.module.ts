import { Module } from '@nestjs/common';

import { CustomerConfigResolver } from 'src/engine/core-modules/customer/customer-config.resolver';
import { CustomerConfigService } from 'src/engine/core-modules/customer/customer-config.service';
import { CustomerDedupSearchResolver } from 'src/engine/core-modules/customer/customer-dedup-search.resolver';
import { CustomerDedupSearchService } from 'src/engine/core-modules/customer/customer-dedup-search.service';
import { CustomerDetailResolver } from 'src/engine/core-modules/customer/customer-detail.resolver';
import { CustomerDetailService } from 'src/engine/core-modules/customer/customer-detail.service';
import { CustomerImportJobResolver } from 'src/engine/core-modules/customer/customer-import-job.resolver';
import { CustomerImportJobService } from 'src/engine/core-modules/customer/customer-import-job.service';
import { CustomerMergeResolver } from 'src/engine/core-modules/customer/customer-merge.resolver';
import { CustomerMergeService } from 'src/engine/core-modules/customer/customer-merge.service';
import { CustomerOperationHistoryResolver } from 'src/engine/core-modules/customer/customer-operation-history.resolver';
import { CustomerOperationHistoryService } from 'src/engine/core-modules/customer/customer-operation-history.service';
import { CustomerPublicPoolActionResolver } from 'src/engine/core-modules/customer/customer-public-pool-action.resolver';
import { CustomerPublicPoolActionService } from 'src/engine/core-modules/customer/customer-public-pool-action.service';
import { CustomerPublicPoolListResolver } from 'src/engine/core-modules/customer/customer-public-pool-list.resolver';
import { CustomerPublicPoolListService } from 'src/engine/core-modules/customer/customer-public-pool-list.service';
import { CustomerRecordMutationResolver } from 'src/engine/core-modules/customer/customer-record-mutation.resolver';
import { CustomerRecordMutationService } from 'src/engine/core-modules/customer/customer-record-mutation.service';
import { CustomerTimelineResolver } from 'src/engine/core-modules/customer/customer-timeline.resolver';
import { CustomerTimelineService } from 'src/engine/core-modules/customer/customer-timeline.service';
import { CustomerWorkspaceListResolver } from 'src/engine/core-modules/customer/customer-workspace-list.resolver';
import { CustomerWorkspaceListService } from 'src/engine/core-modules/customer/customer-workspace-list.service';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';

@Module({
  imports: [ObjectMetadataModule],
  providers: [
    CustomerConfigResolver,
    CustomerConfigService,
    CustomerDedupSearchResolver,
    CustomerDedupSearchService,
    CustomerDetailResolver,
    CustomerDetailService,
    CustomerImportJobResolver,
    CustomerImportJobService,
    CustomerMergeResolver,
    CustomerMergeService,
    CustomerOperationHistoryResolver,
    CustomerOperationHistoryService,
    CustomerPublicPoolActionResolver,
    CustomerPublicPoolActionService,
    CustomerPublicPoolListResolver,
    CustomerPublicPoolListService,
    CustomerRecordMutationResolver,
    CustomerRecordMutationService,
    CustomerTimelineResolver,
    CustomerTimelineService,
    CustomerWorkspaceListResolver,
    CustomerWorkspaceListService,
  ],
})
export class CustomerConfigModule {}
