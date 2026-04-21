import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerImportJobService } from 'src/engine/core-modules/customer/customer-import-job.service';
import {
  CustomerImportJobsArgs,
  CustomerImportJobsDTO,
  CustomerImportJobItemDTO,
  StartCustomerImportJobInput,
} from 'src/engine/core-modules/customer/dto/customer-import-job.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerImportJobsDTO)
export class CustomerImportJobResolver {
  constructor(
    private readonly customerImportJobService: CustomerImportJobService,
  ) {}

  @Query(() => CustomerImportJobsDTO)
  async customerImportJobs(
    @Args() args: CustomerImportJobsArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerImportJobService.getCustomerImportJobs(workspace.id, args);
  }

  @Mutation(() => CustomerImportJobItemDTO)
  async startCustomerImportJob(
    @Args('input') input: StartCustomerImportJobInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerImportJobService.startCustomerImportJob({
      workspaceId: workspace.id,
      input,
    });
  }
}
