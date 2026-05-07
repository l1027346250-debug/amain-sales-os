import { Controller, Get, Req, UseFilters, UseGuards } from '@nestjs/common';

import { type Request } from 'express';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EnterpriseMailboxWorkspaceMemberService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-workspace-member.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';

@Controller('api/enterprise/mailbox-workspace-members')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseMailboxWorkspaceMembersController {
  constructor(
    private readonly enterpriseMailboxWorkspaceMemberService: EnterpriseMailboxWorkspaceMemberService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.enterprisePermissionService.assertCanAccess({
      apiKeyId: authenticatedRequest.apiKey?.id,
      applicationId: authenticatedRequest.application?.id,
      permissionCode: 'enterprise.mailbox.assign',
      userWorkspaceId: authenticatedRequest.userWorkspaceId,
      workspaceId: workspace.id,
    });

    return this.enterpriseMailboxWorkspaceMemberService.findMany(workspace.id);
  }
}
