import { UseGuards } from '@nestjs/common';
import { Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerPublicPoolRuleExecutionService } from 'src/engine/core-modules/customer/customer-public-pool-rule-execution.service';
import { ExecuteCustomerPublicPoolRulesResultDTO } from 'src/engine/core-modules/customer/dto/customer-public-pool-rule-execution.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => ExecuteCustomerPublicPoolRulesResultDTO)
export class CustomerPublicPoolRuleExecutionResolver {
  constructor(
    private readonly customerPublicPoolRuleExecutionService: CustomerPublicPoolRuleExecutionService,
  ) {}

  @Mutation(() => ExecuteCustomerPublicPoolRulesResultDTO)
  async executeCustomerPublicPoolRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ) {
    return this.customerPublicPoolRuleExecutionService.executeCustomerPublicPoolRules({
      workspaceId: workspace.id,
      workspaceMemberId,
    });
  }
}
