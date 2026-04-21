import { UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerConfigAggregateDTO } from 'src/engine/core-modules/customer/dto/customer-config.dto';
import { CustomerConfigService } from 'src/engine/core-modules/customer/customer-config.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerConfigAggregateDTO)
export class CustomerConfigResolver {
  constructor(
    private readonly customerConfigService: CustomerConfigService,
  ) {}

  @Query(() => CustomerConfigAggregateDTO)
  async customerConfig(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.customerConfigService.getCustomerConfig(workspace.id);
  }
}
