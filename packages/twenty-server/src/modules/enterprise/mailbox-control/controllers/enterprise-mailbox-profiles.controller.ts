import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateEnterpriseMailboxProfileDto } from 'src/modules/enterprise/mailbox-control/dtos/create-enterprise-mailbox-profile.dto';
import { EnterpriseMailboxProfileService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-profile.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise/mailbox-profiles')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseMailboxProfilesController {
  constructor(
    private readonly enterpriseMailboxProfileService: EnterpriseMailboxProfileService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.mailbox.read');

    return this.enterpriseMailboxProfileService.findMany(workspace.id);
  }

  @Post()
  async create(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseMailboxProfileDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.mailbox.create',
    );

    return this.enterpriseMailboxProfileService.createMailboxProfile({
      ...dto,
      workspaceId: workspace.id,
      createdByWorkspaceMemberId: authenticatedRequest.workspaceMember?.id ?? null,
    });
  }

  @Post(':id/validate')
  async validateMailboxProfile(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') mailboxProfileId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.mailbox.update');

    return this.enterpriseMailboxProfileService.validateMailboxProfile(
      workspace.id,
      mailboxProfileId,
    );
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
