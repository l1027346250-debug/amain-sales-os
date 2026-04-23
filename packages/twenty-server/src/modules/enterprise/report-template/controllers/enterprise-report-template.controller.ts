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
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';
import { CreateEnterpriseReportTemplateDto } from 'src/modules/enterprise/report-template/dtos/create-enterprise-report-template.dto';
import { UpdateEnterpriseReportTemplateDto } from 'src/modules/enterprise/report-template/dtos/update-enterprise-report-template.dto';
import { EnterpriseReportTemplateService } from 'src/modules/enterprise/report-template/services/enterprise-report-template.service';

@Controller('api/enterprise/report-templates')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseReportTemplateController {
  constructor(
    private readonly enterpriseReportTemplateService: EnterpriseReportTemplateService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.read',
    );

    return this.enterpriseReportTemplateService.findMany(workspace.id);
  }

  @Get(':id')
  async findOne(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.read',
    );

    return this.enterpriseReportTemplateService.findOneOrFail(
      workspace.id,
      templateId,
    );
  }

  @Get(':id/versions')
  async findVersions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.read',
    );

    return this.enterpriseReportTemplateService.findVersions(
      workspace.id,
      templateId,
    );
  }

  @Get(':id/preview')
  async previewTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
    @Query('version') version?: string,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.read',
    );

    return this.enterpriseReportTemplateService.previewTemplate(
      workspace.id,
      templateId,
      version ? Number(version) : undefined,
    );
  }

  @Post()
  async createTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseReportTemplateDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.create',
    );

    return this.enterpriseReportTemplateService.createTemplate(
      workspace.id,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Put(':id')
  async updateTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Body() dto: UpdateEnterpriseReportTemplateDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.updateTemplate(
      workspace.id,
      templateId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch(':id')
  async patchTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Body() dto: UpdateEnterpriseReportTemplateDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.updateTemplate(
      workspace.id,
      templateId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Put(':id/content')
  async updateTemplateContent(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Body() dto: UpdateEnterpriseReportTemplateDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.updateTemplate(
      workspace.id,
      templateId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch(':id/enabled')
  async updateTemplateEnabled(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Body() dto: { enabled?: boolean; isActive?: boolean },
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.setActiveState(
      workspace.id,
      templateId,
      dto.enabled ?? dto.isActive ?? true,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Delete(':id')
  async deleteTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.delete',
    );

    return this.enterpriseReportTemplateService.deleteTemplate(
      workspace.id,
      templateId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post(':id/set-default')
  async setDefaultTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.setDefaultTemplate(
      workspace.id,
      templateId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post(':id/activate')
  async activateTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.setActiveState(
      workspace.id,
      templateId,
      true,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post(':id/deactivate')
  async deactivateTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.reportTemplate.update',
    );

    return this.enterpriseReportTemplateService.setActiveState(
      workspace.id,
      templateId,
      false,
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
