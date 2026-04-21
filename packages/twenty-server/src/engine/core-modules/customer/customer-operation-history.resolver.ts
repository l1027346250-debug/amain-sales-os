import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerOperationHistoryService } from 'src/engine/core-modules/customer/customer-operation-history.service';
import {
  CustomerOperationHistoryArgs,
  CustomerOperationHistoryDTO,
} from 'src/engine/core-modules/customer/dto/customer-operation-history.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerOperationHistoryDTO)
export class CustomerOperationHistoryResolver {
  constructor(
    private readonly customerOperationHistoryService: CustomerOperationHistoryService,
  ) {}

  @Query(() => CustomerOperationHistoryDTO)
  async customerOperationHistory(
    @Args() args: CustomerOperationHistoryArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerOperationHistoryService.getCustomerOperationHistory(
      workspace.id,
      args,
    );
  }
}
