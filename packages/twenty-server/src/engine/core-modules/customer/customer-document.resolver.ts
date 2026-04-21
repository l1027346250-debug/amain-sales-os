import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { CustomerDocumentService } from 'src/engine/core-modules/customer/customer-document.service';
import {
  CustomerDocumentsArgs,
  CustomerDocumentsDTO,
} from 'src/engine/core-modules/customer/dto/customer-document.dto';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@UseGuards(WorkspaceAuthGuard, CustomPermissionGuard)
@CoreResolver(() => CustomerDocumentsDTO)
export class CustomerDocumentResolver {
  constructor(private readonly customerDocumentService: CustomerDocumentService) {}

  @Query(() => CustomerDocumentsDTO)
  async customerDocuments(
    @Args() args: CustomerDocumentsArgs,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ) {
    return this.customerDocumentService.getCustomerDocuments(workspace.id, args);
  }
}
