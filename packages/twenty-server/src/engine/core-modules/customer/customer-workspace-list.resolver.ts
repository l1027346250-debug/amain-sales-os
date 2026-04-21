import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import {
  CustomerWorkspaceListArgs,
  CustomerWorkspaceListDTO,
} from 'src/engine/core-modules/customer/dto/customer-workspace-list.dto';
import { CustomerWorkspaceListService } from 'src/engine/core-modules/customer/customer-workspace-list.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerWorkspaceListDTO)
export class CustomerWorkspaceListResolver {
  constructor(
    private readonly customerWorkspaceListService: CustomerWorkspaceListService,
  ) {}

  @Query(() => CustomerWorkspaceListDTO)
  async customerWorkspaceList(
    @Args() args: CustomerWorkspaceListArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerWorkspaceListService.getCustomerWorkspaceList(
      workspace.id,
      args,
    );
  }
}
