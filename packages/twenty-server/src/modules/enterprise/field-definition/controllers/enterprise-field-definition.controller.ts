import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Request } from 'express';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreateEnterpriseFieldDto } from 'src/modules/enterprise/field-definition/dtos/create-enterprise-field.dto';
import { ReplaceEnterpriseFieldOptionsDto } from 'src/modules/enterprise/field-definition/dtos/replace-enterprise-field-options.dto';
import { UpdateEnterpriseFieldDto } from 'src/modules/enterprise/field-definition/dtos/update-enterprise-field.dto';
import { EnterpriseFieldDefinitionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-definition.service';
import { EnterpriseFieldOptionService } from 'src/modules/enterprise/field-definition/services/enterprise-field-option.service';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseFieldDefinitionController {
  constructor(
    private readonly enterpriseFieldDefinitionService: EnterpriseFieldDefinitionService,
    private readonly enterpriseFieldOptionService: EnterpriseFieldOptionService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get('fields')
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
    @Query('entityType') entityType?: string,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.field.read');

    return this.enterpriseFieldDefinitionService.findMany(workspace.id, entityType);
  }

  @Get('fields/:id')
  async findOne(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') fieldDefinitionId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.field.read');

    return this.enterpriseFieldDefinitionService.findOneOrFail(
      workspace.id,
      fieldDefinitionId,
    );
  }

  @Post('fields')
  async create(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseFieldDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(workspace.id, request, 'enterprise.field.create');

    return this.enterpriseFieldDefinitionService.create(
      workspace.id,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch('fields/:id')
  async update(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') fieldDefinitionId: string,
    @Body() dto: UpdateEnterpriseFieldDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(workspace.id, request, 'enterprise.field.update');

    return this.enterpriseFieldDefinitionService.update(
      workspace.id,
      fieldDefinitionId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Delete('fields/:id')
  async remove(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') fieldDefinitionId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(workspace.id, request, 'enterprise.field.delete');

    return this.enterpriseFieldDefinitionService.remove(
      workspace.id,
      fieldDefinitionId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get('fields/:id/options')
  async findOptions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') fieldDefinitionId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.field.read');

    return this.enterpriseFieldOptionService.findByFieldDefinitionId(
      workspace.id,
      fieldDefinitionId,
    );
  }

  @Put('fields/:id/options')
  async replaceOptions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') fieldDefinitionId: string,
    @Body() dto: ReplaceEnterpriseFieldOptionsDto,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.field.update');

    return this.enterpriseFieldOptionService.replaceOptions(
      workspace.id,
      fieldDefinitionId,
      dto.options,
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
