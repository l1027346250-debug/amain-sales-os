import { Controller, Get, Req, UseFilters, UseGuards } from '@nestjs/common';

import { type Request } from 'express';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EnterpriseMailboxHealthService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-health.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise/mailbox-health')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseMailboxHealthController {
  constructor(
    private readonly enterpriseMailboxHealthService: EnterpriseMailboxHealthService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async listMailboxHealth(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.mailbox.read');

    return this.enterpriseMailboxHealthService.listMailboxHealth(workspace.id);
  }

  private async assertPermission(
    workspaceId: string,
    request: Request,
    permissionCode: EnterprisePermissionCode,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.enterprisePermissionService.assertCanAccess({
      apiKeyId: authenticatedRequest.apiKey?.id,
      applicationId: authenticatedRequest.application?.id,
      permissionCode,
      userWorkspaceId: authenticatedRequest.userWorkspaceId,
      workspaceId,
    });
  }
}
