import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
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
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';
import { EnterpriseRecycleService } from 'src/modules/enterprise/recycle/services/enterprise-recycle.service';

@Controller('api/enterprise/recycle')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseRecycleController {
  constructor(
    private readonly enterpriseRecycleService: EnterpriseRecycleService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get(':resourceType')
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('resourceType') resourceType: string,
    @Req() request: Request,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.recycle.read');

    return this.enterpriseRecycleService.findMany(workspace.id, resourceType, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':resourceType/:id')
  async findOne(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') recordId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.recycle.read');

    return this.enterpriseRecycleService.findOneOrFail(workspace.id, recordId);
  }

  @Post(':resourceType/:id/restore')
  async restore(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') recordId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.recycle.restore',
    );

    return this.enterpriseRecycleService.restore(
      workspace.id,
      recordId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Delete(':resourceType/:id')
  async purge(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') recordId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.recycle.purge',
    );

    return this.enterpriseRecycleService.purge(
      workspace.id,
      recordId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Delete(':resourceType')
  async purgeResourceType(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('resourceType') resourceType: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.recycle.purge',
    );

    return this.enterpriseRecycleService.purgeResourceType(
      workspace.id,
      resourceType,
      authenticatedRequest.workspaceMember?.id ?? null,
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
