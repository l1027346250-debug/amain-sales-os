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
import { CreateEnterpriseWebsiteBindingDto } from 'src/modules/enterprise/independent-station/dtos/create-enterprise-website-binding.dto';
import { FindEnterpriseWebsiteInquiriesDto } from 'src/modules/enterprise/independent-station/dtos/find-enterprise-website-inquiries.dto';
import { ReprocessEnterpriseWebsiteInquiriesDto } from 'src/modules/enterprise/independent-station/dtos/reprocess-enterprise-website-inquiries.dto';
import { ReplaceEnterpriseInquiryAssignmentRulesDto } from 'src/modules/enterprise/independent-station/dtos/replace-enterprise-inquiry-assignment-rules.dto';
import { ReplaceEnterpriseInquiryFormMappingsDto } from 'src/modules/enterprise/independent-station/dtos/replace-enterprise-inquiry-form-mappings.dto';
import { UpdateEnterpriseWebsiteInquiryDto } from 'src/modules/enterprise/independent-station/dtos/update-enterprise-website-inquiry.dto';
import { UpdateEnterpriseWebsiteInquiriesDto } from 'src/modules/enterprise/independent-station/dtos/update-enterprise-website-inquiries.dto';
import { UpdateEnterpriseWebsiteBindingDto } from 'src/modules/enterprise/independent-station/dtos/update-enterprise-website-binding.dto';
import { EnterpriseIndependentStationService } from 'src/modules/enterprise/independent-station/services/enterprise-independent-station.service';

@Controller('api/enterprise/independent-stations')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseIndependentStationController {
  constructor(
    private readonly enterpriseIndependentStationService: EnterpriseIndependentStationService,
  ) {}

  @Get()
  async findWebsiteBindings(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.enterpriseIndependentStationService.findWebsiteBindings(
      workspace.id,
    );
  }

  @Post()
  async createWebsiteBinding(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Body() dto: CreateEnterpriseWebsiteBindingDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.createWebsiteBinding(
      workspace.id,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch(':id')
  async updateWebsiteBinding(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Body() dto: UpdateEnterpriseWebsiteBindingDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.updateWebsiteBinding(
      workspace.id,
      websiteBindingId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Delete(':id')
  async deleteWebsiteBinding(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.deleteWebsiteBinding(
      workspace.id,
      websiteBindingId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get(':id/form-mappings')
  async findFormMappings(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
  ) {
    return this.enterpriseIndependentStationService.findFormMappings(
      workspace.id,
      websiteBindingId,
    );
  }

  @Put(':id/form-mappings')
  async replaceFormMappings(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Body() dto: ReplaceEnterpriseInquiryFormMappingsDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.replaceFormMappings(
      workspace.id,
      websiteBindingId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Get(':id/assignment-rules')
  async findAssignmentRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
  ) {
    return this.enterpriseIndependentStationService.findAssignmentRules(
      workspace.id,
      websiteBindingId,
    );
  }

  @Get(':id/inquiries')
  async findInquiries(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Query() query: FindEnterpriseWebsiteInquiriesDto,
  ) {
    return this.enterpriseIndependentStationService.findInquiries(
      workspace.id,
      websiteBindingId,
      query,
    );
  }

  @Patch(':id/inquiries/:inquiryId')
  async updateInquiry(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Param('inquiryId') inquiryId: string,
    @Body() dto: UpdateEnterpriseWebsiteInquiryDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.updateInquiry(
      workspace.id,
      websiteBindingId,
      inquiryId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Patch(':id/inquiries')
  async updateInquiries(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Body() dto: UpdateEnterpriseWebsiteInquiriesDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.updateInquiries(
      workspace.id,
      websiteBindingId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post(':id/inquiries/reprocess')
  async reprocessInquiries(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Body() dto: ReprocessEnterpriseWebsiteInquiriesDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.reprocessInquiries(
      workspace.id,
      websiteBindingId,
      dto.statuses,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Post(':id/inquiries/:inquiryId/reprocess')
  async reprocessInquiry(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Param('inquiryId') inquiryId: string,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.reprocessInquiry(
      workspace.id,
      websiteBindingId,
      inquiryId,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }

  @Put(':id/assignment-rules')
  async replaceAssignmentRules(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Param('id') websiteBindingId: string,
    @Body() dto: ReplaceEnterpriseInquiryAssignmentRulesDto,
    @Req() request: Request,
  ) {
    const authenticatedRequest = request as AuthenticatedRequest;

    return this.enterpriseIndependentStationService.replaceAssignmentRules(
      workspace.id,
      websiteBindingId,
      dto,
      authenticatedRequest.workspaceMember?.id ?? null,
    );
  }
}
