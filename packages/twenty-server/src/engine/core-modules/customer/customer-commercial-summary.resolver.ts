import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerCommercialSummaryService } from 'src/engine/core-modules/customer/customer-commercial-summary.service';
import {
  RefreshCustomerCommercialSummaryInput,
  RefreshCustomerCommercialSummaryResultDTO,
} from 'src/engine/core-modules/customer/dto/customer-commercial-summary.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => RefreshCustomerCommercialSummaryResultDTO)
export class CustomerCommercialSummaryResolver {
  constructor(
    private readonly customerCommercialSummaryService: CustomerCommercialSummaryService,
  ) {}

  @Mutation(() => RefreshCustomerCommercialSummaryResultDTO)
  async refreshCustomerCommercialSummary(
    @Args('input') input: RefreshCustomerCommercialSummaryInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerCommercialSummaryService.refreshCustomerCommercialSummary({
      workspaceId: workspace.id,
      input,
    });
  }
}
