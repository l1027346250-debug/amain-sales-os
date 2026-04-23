import {
  Body,
  Controller,
  Get,
  Param,
  Put,
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
import { ReplaceEnterpriseRolePermissionsDto } from 'src/modules/enterprise/permissions/dtos/replace-enterprise-role-permissions.dto';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise/permissions')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterprisePermissionController {
  constructor(
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async findCatalog(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.permissions.read',
    );

    return this.enterprisePermissionService.getPermissionCatalog();
  }

  @Get('roles/:roleId')
  async findRolePermissions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('roleId') roleId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.permissions.read',
    );

    return this.enterprisePermissionService.findRolePermissions(
      workspace.id,
      roleId,
    );
  }

  @Put('roles/:roleId')
  async replaceRolePermissions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('roleId') roleId: string,
    @Body() dto: ReplaceEnterpriseRolePermissionsDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.permissions.update',
    );

    return this.enterprisePermissionService.replaceRolePermissions({
      actorWorkspaceMemberId: authenticatedRequest.workspaceMember?.id ?? null,
      permissionCodes: dto.permissionCodes,
      roleId,
      workspaceId: workspace.id,
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
