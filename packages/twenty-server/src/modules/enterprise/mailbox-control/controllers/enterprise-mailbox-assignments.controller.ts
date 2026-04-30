import {
  Body,
  Controller,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { AssignEnterpriseMailboxDto } from 'src/modules/enterprise/mailbox-control/dtos/assign-enterprise-mailbox.dto';
import { EnterpriseMailboxAssignmentService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-assignment.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise/mailbox-assignments')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseMailboxAssignmentsController {
  constructor(
    private readonly enterpriseMailboxAssignmentService: EnterpriseMailboxAssignmentService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Post()
  async assignMailbox(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: AssignEnterpriseMailboxDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.mailbox.assign',
    );

    return this.enterpriseMailboxAssignmentService.assignMailbox({
      ...dto,
      workspaceId: workspace.id,
      assignedByWorkspaceMemberId: authenticatedRequest.workspaceMember?.id ?? null,
    });
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
