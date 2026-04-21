import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateEnterpriseReportTemplateDto } from 'src/modules/enterprise/report-template/dtos/create-enterprise-report-template.dto';
import { UpdateEnterpriseReportTemplateDto } from 'src/modules/enterprise/report-template/dtos/update-enterprise-report-template.dto';
import { EnterpriseReportTemplateService } from 'src/modules/enterprise/report-template/services/enterprise-report-template.service';

@Controller('api/enterprise/report-templates')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseReportTemplateController {
  constructor(
    private readonly enterpriseReportTemplateService: EnterpriseReportTemplateService,
  ) {}

  @Get()
  async findMany(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.enterpriseReportTemplateService.findMany(workspace.id);
  }

  @Get(':id')
  async findOne(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
  ) {
    return this.enterpriseReportTemplateService.findOneOrFail(
      workspace.id,
      templateId,
    );
  }

  @Get(':id/versions')
  async findVersions(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
  ) {
    return this.enterpriseReportTemplateService.findVersions(
      workspace.id,
      templateId,
    );
  }

  @Get(':id/preview')
  async previewTemplate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') templateId: string,
    @Query('version') version?: string,
  ) {
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

    return this.enterpriseReportTemplateService.updateTemplate(
      workspace.id,
      templateId,
      dto,
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

    return this.enterpriseReportTemplateService.setActiveState(
      workspace.id,
      templateId,
      false,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }
}

