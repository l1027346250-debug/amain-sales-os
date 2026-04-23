import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { type Request, type Response } from 'express';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { type AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreateEnterpriseCustomerExportJobDto } from 'src/modules/enterprise/customer-export/dtos/create-enterprise-customer-export-job.dto';
import { PreviewEnterpriseCustomerExportCountDto } from 'src/modules/enterprise/customer-export/dtos/preview-enterprise-customer-export-count.dto';
import { EnterpriseCustomerExportService } from 'src/modules/enterprise/customer-export/services/enterprise-customer-export.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';

@Controller('api/enterprise/customer-export')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseCustomerExportController {
  constructor(
    private readonly enterpriseCustomerExportService: EnterpriseCustomerExportService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Post('preview-count')
  async previewCount(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: PreviewEnterpriseCustomerExportCountDto,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.read',
    );

    return this.enterpriseCustomerExportService.previewCount(workspace.id, dto);
  }

  @Post('jobs')
  async createJob(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseCustomerExportJobDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.create',
    );

    return this.enterpriseCustomerExportService.createJob(
      workspace.id,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post('jobs/:id/enqueue')
  async enqueueJob(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') jobId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.create',
    );

    return this.enterpriseCustomerExportService.enqueueJob(
      workspace.id,
      jobId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get('jobs')
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.read',
    );

    return this.enterpriseCustomerExportService.findMany(workspace.id);
  }

  @Get('jobs/:id')
  async findOne(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') jobId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.read',
    );

    return this.enterpriseCustomerExportService.findOneOrFail(
      workspace.id,
      jobId,
    );
  }

  @Get('jobs/:id/file-access')
  async getFileAccess(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') jobId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.download',
    );

    return this.enterpriseCustomerExportService.getFileAccess(
      workspace.id,
      jobId,
    );
  }

  @Get('jobs/:id/download')
  async downloadCsv(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') jobId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.customerExport.download',
    );

    const fileAccess = await this.enterpriseCustomerExportService.getFileAccess(
      workspace.id,
      jobId,
    );

    return response.redirect(fileAccess.downloadUrl);
  }

  private async assertPermission(
    workspaceId: string,
    request: Request,
    permissionCode:
      | 'enterprise.customerExport.create'
      | 'enterprise.customerExport.download'
      | 'enterprise.customerExport.read',
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
