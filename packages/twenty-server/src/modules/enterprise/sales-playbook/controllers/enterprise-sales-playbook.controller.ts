import {
  Body,
  Controller,
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
import { CreateEnterpriseSalesPlaybookDto } from 'src/modules/enterprise/sales-playbook/dtos/create-enterprise-sales-playbook.dto';
import { ReplaceEnterpriseSalesPlaybookItemsDto } from 'src/modules/enterprise/sales-playbook/dtos/replace-enterprise-sales-playbook-items.dto';
import { ReplaceEnterpriseSalesPlaybookStagesDto } from 'src/modules/enterprise/sales-playbook/dtos/replace-enterprise-sales-playbook-stages.dto';
import { UpdateEnterpriseSalesPlaybookDto } from 'src/modules/enterprise/sales-playbook/dtos/update-enterprise-sales-playbook.dto';
import { EnterpriseSalesPlaybookService } from 'src/modules/enterprise/sales-playbook/services/enterprise-sales-playbook.service';

@Controller()
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseSalesPlaybookController {
  constructor(
    private readonly enterpriseSalesPlaybookService: EnterpriseSalesPlaybookService,
  ) {}

  @Get('api/enterprise/sales-playbooks')
  async findPlaybooks(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.enterpriseSalesPlaybookService.findPlaybooks(workspace.id);
  }

  @Post('api/enterprise/sales-playbooks')
  async createPlaybook(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseSalesPlaybookDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseSalesPlaybookService.createPlaybook(
      workspace.id,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch('api/enterprise/sales-playbooks/:id')
  async updatePlaybook(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') playbookId: string,
    @Body() dto: UpdateEnterpriseSalesPlaybookDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseSalesPlaybookService.updatePlaybook(
      workspace.id,
      playbookId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get('api/enterprise/sales-playbooks/:id/stages')
  async findStages(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') playbookId: string,
  ) {
    return this.enterpriseSalesPlaybookService.findStages(
      workspace.id,
      playbookId,
    );
  }

  @Put('api/enterprise/sales-playbooks/:id/stages')
  async replaceStages(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') playbookId: string,
    @Body() dto: ReplaceEnterpriseSalesPlaybookStagesDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseSalesPlaybookService.replaceStages(
      workspace.id,
      playbookId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get('api/enterprise/sales-playbook-stages/:stageId/items')
  async findItems(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('stageId') stageId: string,
  ) {
    return this.enterpriseSalesPlaybookService.findItems(workspace.id, stageId);
  }

  @Put('api/enterprise/sales-playbook-stages/:stageId/items')
  async replaceItems(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('stageId') stageId: string,
    @Body() dto: ReplaceEnterpriseSalesPlaybookItemsDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseSalesPlaybookService.replaceItems(
      workspace.id,
      stageId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get('api/sales-assistant/contextual-content')
  async findContextualContent(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Query('stageCode') stageCode?: string,
    @Query('objectType') objectType?: string,
  ) {
    return this.enterpriseSalesPlaybookService.findContextualContent(
      workspace.id,
      stageCode,
      objectType,
    );
  }
}
