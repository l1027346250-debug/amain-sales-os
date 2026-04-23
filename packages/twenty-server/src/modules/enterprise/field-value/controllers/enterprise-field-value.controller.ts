import {
  Body,
  Controller,
  Get,
  Param,
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
import { UpdateEnterpriseRecordFieldValuesDto } from 'src/modules/enterprise/field-value/dtos/update-enterprise-record-field-values.dto';
import { EnterpriseFieldValueService } from 'src/modules/enterprise/field-value/services/enterprise-field-value.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';
import { type EnterprisePermissionCode } from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Controller('api/enterprise/records')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseFieldValueController {
  constructor(
    private readonly enterpriseFieldValueService: EnterpriseFieldValueService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get(':entityType/field-values')
  async findManyForRecords(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('entityType') entityType: string,
    @Query('recordIds') recordIds: string | string[] | undefined,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.field.read');

    return this.enterpriseFieldValueService.findManyForRecords(
      workspace.id,
      entityType,
      this.normalizeRecordIds(recordIds),
    );
  }

  @Get(':entityType/:recordId/field-values')
  async findManyForRecord(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request, 'enterprise.field.read');

    return this.enterpriseFieldValueService.findManyForRecord(
      workspace.id,
      entityType,
      recordId,
    );
  }

  @Put(':entityType/:recordId/field-values')
  async updateManyForRecord(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateEnterpriseRecordFieldValuesDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(workspace.id, request, 'enterprise.field.update');

    return this.enterpriseFieldValueService.updateManyForRecord(
      workspace.id,
      entityType,
      recordId,
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

  private normalizeRecordIds(recordIds: string | string[] | undefined) {
    if (!recordIds) {
      return [];
    }

    return (Array.isArray(recordIds) ? recordIds : [recordIds])
      .flatMap((recordId) => recordId.split(','))
      .map((recordId) => recordId.trim())
      .filter(Boolean)
      .slice(0, 100);
  }
}
