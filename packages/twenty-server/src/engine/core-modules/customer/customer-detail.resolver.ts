import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import {
  CustomerDetailAggregateDTO,
  CustomerDetailArgs,
} from 'src/engine/core-modules/customer/dto/customer-detail.dto';
import { CustomerDetailService } from 'src/engine/core-modules/customer/customer-detail.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerDetailAggregateDTO)
export class CustomerDetailResolver {
  constructor(
    private readonly customerDetailService: CustomerDetailService,
  ) {}

  @Query(() => CustomerDetailAggregateDTO)
  async customerDetail(
    @Args() args: CustomerDetailArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerDetailService.getCustomerDetail(workspace.id, args);
  }
}
