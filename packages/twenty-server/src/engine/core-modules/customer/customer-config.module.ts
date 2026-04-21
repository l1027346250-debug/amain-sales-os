import { Module } from '@nestjs/common';

import { CustomerConfigResolver } from 'src/engine/core-modules/customer/customer-config.resolver';
import { CustomerConfigService } from 'src/engine/core-modules/customer/customer-config.service';
import { CustomerDetailResolver } from 'src/engine/core-modules/customer/customer-detail.resolver';
import { CustomerDetailService } from 'src/engine/core-modules/customer/customer-detail.service';
import { CustomerWorkspaceListResolver } from 'src/engine/core-modules/customer/customer-workspace-list.resolver';
import { CustomerWorkspaceListService } from 'src/engine/core-modules/customer/customer-workspace-list.service';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';

@Module({
  imports: [ObjectMetadataModule],
  providers: [
    CustomerConfigResolver,
    CustomerConfigService,
    CustomerDetailResolver,
    CustomerDetailService,
    CustomerWorkspaceListResolver,
    CustomerWorkspaceListService,
  ],
})
export class CustomerConfigModule {}
