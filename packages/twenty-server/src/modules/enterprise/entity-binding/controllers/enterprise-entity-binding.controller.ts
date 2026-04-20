import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { EnterpriseEntityBindingService } from 'src/modules/enterprise/entity-binding/services/enterprise-entity-binding.service';

@Controller('api/enterprise/entities')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class EnterpriseEntityBindingController {
  constructor(
    private readonly enterpriseEntityBindingService: EnterpriseEntityBindingService,
  ) {}

  @Get()
  async findAll(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.enterpriseEntityBindingService.listEntities(workspace.id);
  }
}
