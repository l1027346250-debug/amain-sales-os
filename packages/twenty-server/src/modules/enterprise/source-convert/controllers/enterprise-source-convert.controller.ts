import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateEnterpriseSourceBlacklistRuleDto } from 'src/modules/enterprise/source-convert/dtos/create-enterprise-source-blacklist-rule.dto';
import { ExecuteEnterpriseSourceConvertDto } from 'src/modules/enterprise/source-convert/dtos/execute-enterprise-source-convert.dto';
import { UpdateEnterpriseSourceConvertRuleEnabledDto } from 'src/modules/enterprise/source-convert/dtos/update-enterprise-source-convert-rule-enabled.dto';
import { UpdateEnterpriseSourceConvertRuleDto } from 'src/modules/enterprise/source-convert/dtos/update-enterprise-source-convert-rule.dto';
import { EnterpriseSourceConvertService } from 'src/modules/enterprise/source-convert/services/enterprise-source-convert.service';

@Controller()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseSourceConvertController {
  constructor(
    private readonly enterpriseSourceConvertService: EnterpriseSourceConvertService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get('api/enterprise/source-convert/categories')
  async findCategories(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.read',
    );

    return this.enterpriseSourceConvertService.findCategories(workspace.id);
  }

  @Get('api/enterprise/source-convert/rules')
  async findRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
    @Query('categoryCode') categoryCode?: string,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.read',
    );

    return this.enterpriseSourceConvertService.findRules(
      workspace.id,
      categoryCode,
    );
  }

  @Get('api/enterprise/source-convert/rules/:id')
  async findRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') ruleId: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.read',
    );

    return this.enterpriseSourceConvertService.findRuleOrFail(
      workspace.id,
      ruleId,
    );
  }

  @Patch('api/enterprise/source-convert/rules/:id')
  async updateRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') ruleId: string,
    @Body() dto: UpdateEnterpriseSourceConvertRuleDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.update',
    );

    return this.enterpriseSourceConvertService.updateRule(
      workspace.id,
      ruleId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch('api/enterprise/source-convert/rules/:id/enabled')
  async updateRuleEnabled(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') ruleId: string,
    @Body() dto: UpdateEnterpriseSourceConvertRuleEnabledDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.update',
    );

    return this.enterpriseSourceConvertService.updateRuleEnabled(
      workspace.id,
      ruleId,
      dto.enabled,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get('api/enterprise/source-convert/blacklist')
  async findBlacklist(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.blacklist.read',
    );

    return this.enterpriseSourceConvertService.findBlacklist(workspace.id);
  }

  @Post('api/enterprise/source-convert/blacklist')
  async createBlacklistRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseSourceBlacklistRuleDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.blacklist.update',
    );

    return this.enterpriseSourceConvertService.createBlacklistRule(
      workspace.id,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Delete('api/enterprise/source-convert/blacklist/:id')
  async deleteBlacklistRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') blacklistRuleId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.assertPermission(
      workspace.id,
      request,
      'enterprise.sourceConvert.blacklist.update',
    );

    return this.enterpriseSourceConvertService.deleteBlacklistRule(
      workspace.id,
      blacklistRuleId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post('internal/source-convert/execute')
  async execute(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: ExecuteEnterpriseSourceConvertDto,
  ) {
    return this.enterpriseSourceConvertService.execute(workspace.id, dto);
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
