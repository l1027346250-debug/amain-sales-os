import {
  Body,
  Controller,
  Get,
  Put,
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
import { UpsertEnterpriseFieldLayoutsDto } from 'src/modules/enterprise/field-layout/dtos/upsert-enterprise-field-layouts.dto';
import { EnterpriseFieldLayoutService } from 'src/modules/enterprise/field-layout/services/enterprise-field-layout.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise/field-layouts')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseFieldLayoutController {
  constructor(
    private readonly enterpriseFieldLayoutService: EnterpriseFieldLayoutService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Query('entityType') entityType: string,
    @Query('pageScene') pageScene: string,
    @Req() request: Request,
    @Query('roleId') roleId?: string,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.fieldLayout.read',
    );

    return this.enterpriseFieldLayoutService.findMany(
      workspace.id,
      entityType,
      pageScene,
      roleId,
    );
  }

  @Put()
  async upsertMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: UpsertEnterpriseFieldLayoutsDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.fieldLayout.update',
    );

    return this.enterpriseFieldLayoutService.upsertMany(
      workspace.id,
      dto,
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
