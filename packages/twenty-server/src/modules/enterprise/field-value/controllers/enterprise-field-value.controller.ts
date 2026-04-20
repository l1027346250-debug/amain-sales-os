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
import { UpdateEnterpriseRecordFieldValuesDto } from 'src/modules/enterprise/field-value/dtos/update-enterprise-record-field-values.dto';
import { EnterpriseFieldValueService } from 'src/modules/enterprise/field-value/services/enterprise-field-value.service';

@Controller('api/enterprise/records')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseFieldValueController {
  constructor(
    private readonly enterpriseFieldValueService: EnterpriseFieldValueService,
  ) {}

  @Get(':entityType/:recordId/field-values')
  async findManyForRecord(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('entityType') entityType: string,
    @Param('recordId') recordId: string,
  ) {
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

    return this.enterpriseFieldValueService.updateManyForRecord(
      workspace.id,
      entityType,
      recordId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }
}
