import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerDedupSearchService } from 'src/engine/core-modules/customer/customer-dedup-search.service';
import {
  CustomerDedupSearchArgs,
  CustomerDedupSearchDTO,
} from 'src/engine/core-modules/customer/dto/customer-dedup-search.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerDedupSearchDTO)
export class CustomerDedupSearchResolver {
  constructor(
    private readonly customerDedupSearchService: CustomerDedupSearchService,
  ) {}

  @Query(() => CustomerDedupSearchDTO)
  async customerDedupSearch(
    @Args() args: CustomerDedupSearchArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerDedupSearchService.searchCustomerDuplicates(
      workspace.id,
      args,
    );
  }
}
