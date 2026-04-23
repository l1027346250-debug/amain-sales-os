import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { PermissionFlagType } from 'twenty-shared/constants';
import { Repository } from 'typeorm';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { RoleTargetEntity } from 'src/engine/metadata-modules/role-target/role-target.entity';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseRolePermissionEntity } from 'src/modules/enterprise/permissions/enterprise-role-permission.entity';
import {
  ENTERPRISE_PERMISSION_CODES,
  isEnterprisePermissionCode,
  type EnterprisePermissionCode,
} from 'src/modules/enterprise/permissions/types/enterprise-permission-code';

@Injectable()
export class EnterprisePermissionService {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
    @InjectRepository(EnterpriseRolePermissionEntity)
    private readonly enterpriseRolePermissionRepository: Repository<EnterpriseRolePermissionEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(RoleTargetEntity)
    private readonly roleTargetRepository: Repository<RoleTargetEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
  ) {}

  async assertCanAccess({
    apiKeyId,
    applicationId,
    permissionCode,
    userWorkspaceId,
    workspaceId,
  }: {
    apiKeyId?: string;
    applicationId?: string;
    permissionCode: EnterprisePermissionCode;
    userWorkspaceId?: string;
    workspaceId: string;
  }) {
    const fineGrainedPermission = await this.hasFineGrainedPermission({
      apiKeyId,
      applicationId,
      permissionCode,
      userWorkspaceId,
      workspaceId,
    });

    if (fineGrainedPermission === true) {
      return;
    }

    if (fineGrainedPermission === false) {
      this.throwPermissionDenied(permissionCode);
    }

    const hasEnterprisePermission = await this.hasEnterpriseFallbackPermission({
      apiKeyId,
      applicationId,
      userWorkspaceId,
      workspaceId,
    });

    if (hasEnterprisePermission) {
      return;
    }

    this.throwPermissionDenied(permissionCode);
  }

  getPermissionCatalog() {
    return ENTERPRISE_PERMISSION_CODES.map((permissionCode) => ({
      permissionCode,
    }));
  }

  async findRolePermissions(workspaceId: string, roleId: string) {
    await this.findRoleOrFail(workspaceId, roleId);

    const permissions = await this.enterpriseRolePermissionRepository.find({
      order: { permissionCode: 'ASC' },
      where: { roleId, workspaceId },
    });

    return {
      configured: permissions.length > 0,
      permissionCodes: permissions
        .filter((permission) => permission.granted)
        .map((permission) => permission.permissionCode),
      permissions: permissions.map((permission) => ({
        granted: permission.granted,
        permissionCode: permission.permissionCode,
      })),
      roleId,
    };
  }

  async replaceRolePermissions({
    actorWorkspaceMemberId,
    permissionCodes,
    roleId,
    workspaceId,
  }: {
    actorWorkspaceMemberId?: string | null;
    permissionCodes: string[];
    roleId: string;
    workspaceId: string;
  }) {
    await this.findRoleOrFail(workspaceId, roleId);

    const uniquePermissionCodes = [...new Set(permissionCodes)];
    const invalidPermissionCodes = uniquePermissionCodes.filter(
      (permissionCode) => !isEnterprisePermissionCode(permissionCode),
    );

    if (invalidPermissionCodes.length > 0) {
      throw new BadRequestException(
        `Invalid enterprise permission codes: ${invalidPermissionCodes.join(', ')}`,
      );
    }

    const before = await this.findRolePermissions(workspaceId, roleId);
    const grantedPermissionCodes = new Set(uniquePermissionCodes);

    await this.enterpriseRolePermissionRepository.manager.transaction(
      async (transactionManager) => {
        await transactionManager.delete(EnterpriseRolePermissionEntity, {
          roleId,
          workspaceId,
        });

        await transactionManager.insert(
          EnterpriseRolePermissionEntity,
          ENTERPRISE_PERMISSION_CODES.map((permissionCode) => ({
            createdByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
            granted: grantedPermissionCodes.has(permissionCode),
            permissionCode,
            roleId,
            updatedByWorkspaceMemberId: actorWorkspaceMemberId ?? null,
            workspaceId,
          })),
        );
      },
    );

    const after = await this.findRolePermissions(workspaceId, roleId);

    await this.enterpriseConfigAuditService.createLog({
      action: 'enterprise_permissions.replace_role_permissions',
      afterJson: after,
      beforeJson: before,
      actorWorkspaceMemberId: actorWorkspaceMemberId ?? null,
      resourceId: roleId,
      resourceType: 'enterpriseRolePermission',
      workspaceId,
    });

    return after;
  }

  private throwPermissionDenied(permissionCode: EnterprisePermissionCode): never {
    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
      {
        userFriendlyMessage: msg`You do not have permission to access this enterprise management action.`,
        value: permissionCode,
      },
    );
  }

  private async hasFineGrainedPermission({
    apiKeyId,
    applicationId,
    permissionCode,
    userWorkspaceId,
    workspaceId,
  }: {
    apiKeyId?: string;
    applicationId?: string;
    permissionCode: EnterprisePermissionCode;
    userWorkspaceId?: string;
    workspaceId: string;
  }) {
    const roleId = await this.resolveRoleId({
      apiKeyId,
      applicationId,
      userWorkspaceId,
      workspaceId,
    });

    if (!roleId) {
      return null;
    }

    const permissions = await this.enterpriseRolePermissionRepository.find({
      where: { roleId, workspaceId },
    });

    if (permissions.length === 0) {
      return null;
    }

    return permissions.some(
      (permission) =>
        permission.permissionCode === permissionCode && permission.granted,
    );
  }

  private async resolveRoleId({
    apiKeyId,
    applicationId,
    userWorkspaceId,
    workspaceId,
  }: {
    apiKeyId?: string;
    applicationId?: string;
    userWorkspaceId?: string;
    workspaceId: string;
  }) {
    if (apiKeyId) {
      const roleTarget = await this.roleTargetRepository.findOne({
        where: { apiKeyId, workspaceId },
      });

      return roleTarget?.roleId ?? null;
    }

    if (userWorkspaceId) {
      const roleTarget = await this.roleTargetRepository.findOne({
        where: { userWorkspaceId, workspaceId },
      });

      return roleTarget?.roleId ?? null;
    }

    if (applicationId) {
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId, workspaceId },
      });

      return application?.defaultRoleId ?? null;
    }

    return null;
  }

  private async findRoleOrFail(workspaceId: string, roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, workspaceId },
    });

    if (!role) {
      throw new NotFoundException(`Enterprise role ${roleId} was not found`);
    }

    return role;
  }

  private async hasEnterpriseFallbackPermission({
    apiKeyId,
    applicationId,
    userWorkspaceId,
    workspaceId,
  }: {
    apiKeyId?: string;
    applicationId?: string;
    userWorkspaceId?: string;
    workspaceId: string;
  }) {
    return (
      (await this.permissionsService.userHasWorkspaceSettingPermission({
        apiKeyId,
        applicationId,
        setting: PermissionFlagType.ENTERPRISE,
        userWorkspaceId,
        workspaceId,
      })) ||
      (await this.permissionsService.userHasWorkspaceSettingPermission({
        apiKeyId,
        applicationId,
        setting: PermissionFlagType.WORKSPACE,
        userWorkspaceId,
        workspaceId,
      }))
    );
  }
}
