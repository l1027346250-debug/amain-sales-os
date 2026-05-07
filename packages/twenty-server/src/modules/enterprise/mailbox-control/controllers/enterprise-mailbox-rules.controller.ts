import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateEnterpriseMailboxRuleDto } from 'src/modules/enterprise/mailbox-control/dtos/create-enterprise-mailbox-rule.dto';
import { UpdateEnterpriseMailboxRuleDto } from 'src/modules/enterprise/mailbox-control/dtos/update-enterprise-mailbox-rule.dto';
import { EnterpriseMailboxRuleService } from 'src/modules/enterprise/mailbox-control/services/enterprise-mailbox-rule.service';
import { EnterprisePermissionService } from 'src/modules/enterprise/permissions/services/enterprise-permission.service';

@Controller('api/enterprise/mailbox-rules')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseMailboxRulesController {
  constructor(
    private readonly enterpriseMailboxRuleService: EnterpriseMailboxRuleService,
    private readonly enterprisePermissionService: EnterprisePermissionService,
  ) {}

  @Get()
  async findMany(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request);

    return this.enterpriseMailboxRuleService.findMany(workspace.id);
  }

  @Get('activity')
  async findRecentActivity(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request);

    return this.enterpriseMailboxRuleService.findRecentActivity(workspace.id);
  }

  @Get('readiness')
  async findReadinessPreview(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request);

    return this.enterpriseMailboxRuleService.findReadinessPreview(workspace.id);
  }

  @Get(':id/preview')
  async findRuleDryRunPreview(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request);

    return this.enterpriseMailboxRuleService.findRuleDryRunPreview(
      workspace.id,
      id,
    );
  }

  @Post()
  async createRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseMailboxRuleDto,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request);

    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseMailboxRuleService.createRule({
      ...dto,
      workspaceId: workspace.id,
      createdByWorkspaceMemberId: authenticatedRequest.workspaceMember?.id ?? null,
    });
  }

  @Patch(':id')
  async updateRule(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') id: string,
    @Body() dto: UpdateEnterpriseMailboxRuleDto,
    @Req() request: Request,
  ) {
    await this.assertPermission(workspace.id, request);

    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseMailboxRuleService.updateRule({
      ...dto,
      id,
      workspaceId: workspace.id,
      updatedByWorkspaceMemberId: authenticatedRequest.workspaceMember?.id ?? null,
    });
  }

  private async assertPermission(workspaceId: string, request: Request) {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.enterprisePermissionService.assertCanAccess({
      apiKeyId: authenticatedRequest.apiKey?.id,
      applicationId: authenticatedRequest.application?.id,
      permissionCode: 'enterprise.mailbox.update',
      userWorkspaceId: authenticatedRequest.userWorkspaceId,
      workspaceId,
    });
  }
}
