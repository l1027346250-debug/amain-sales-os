import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerAiInsightService } from 'src/engine/core-modules/customer/customer-ai-insight.service';
import {
  CustomerAiInsightArgs,
  CustomerAiInsightDTO,
} from 'src/engine/core-modules/customer/dto/customer-ai-insight.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerAiInsightDTO)
export class CustomerAiInsightResolver {
  constructor(private readonly customerAiInsightService: CustomerAiInsightService) {}

  @Query(() => CustomerAiInsightDTO)
  async customerAiInsight(
    @Args() args: CustomerAiInsightArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerAiInsightService.getCustomerAiInsight(workspace.id, args);
  }
}
