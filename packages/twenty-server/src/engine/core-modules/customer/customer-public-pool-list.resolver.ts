import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerPublicPoolListService } from 'src/engine/core-modules/customer/customer-public-pool-list.service';
import {
  CustomerPublicPoolListArgs,
  CustomerPublicPoolListDTO,
} from 'src/engine/core-modules/customer/dto/customer-public-pool-list.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerPublicPoolListDTO)
export class CustomerPublicPoolListResolver {
  constructor(
    private readonly customerPublicPoolListService: CustomerPublicPoolListService,
  ) {}

  @Query(() => CustomerPublicPoolListDTO)
  async customerPublicPoolList(
    @Args() args: CustomerPublicPoolListArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerPublicPoolListService.getCustomerPublicPoolList(
      workspace.id,
      args,
    );
  }
}
