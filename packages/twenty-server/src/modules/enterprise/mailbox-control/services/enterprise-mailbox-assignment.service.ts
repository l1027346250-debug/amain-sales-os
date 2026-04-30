import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { EnterpriseConfigAuditService } from 'src/modules/enterprise/audit/services/enterprise-config-audit.service';
import { EnterpriseMailboxAssignmentEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-assignment.entity';
import { EnterpriseMailboxPermissionEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-permission.entity';
import { EnterpriseMailboxProfileEntity } from 'src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity';

type AssignEnterpriseMailboxInput = {
  workspaceId: string;
  mailboxProfileId: string;
  workspaceMemberId: string;
  assignedByWorkspaceMemberId?: string | null;
  isPrimaryMailbox?: boolean;
  canReceive?: boolean;
  canSend?: boolean;
  canViewSubordinates?: boolean;
  canHandleSubordinates?: boolean;
  canManageRules?: boolean;
  permissionCodes?: string[];
};

@Injectable()
export class EnterpriseMailboxAssignmentService {
  constructor(
    @InjectRepository(EnterpriseMailboxAssignmentEntity)
    private readonly enterpriseMailboxAssignmentRepository: Repository<EnterpriseMailboxAssignmentEntity>,
    @InjectRepository(EnterpriseMailboxProfileEntity)
    private readonly enterpriseMailboxProfileRepository: Repository<EnterpriseMailboxProfileEntity>,
    @InjectRepository(EnterpriseMailboxPermissionEntity)
    private readonly enterpriseMailboxPermissionRepository: Repository<EnterpriseMailboxPermissionEntity>,
    private readonly enterpriseConfigAuditService: EnterpriseConfigAuditService,
  ) {}

  async assignMailbox(input: AssignEnterpriseMailboxInput) {
    await this.enterpriseMailboxProfileRepository.findOneByOrFail({
      id: input.mailboxProfileId,
      workspaceId: input.workspaceId,
    });

    const assignment = this.enterpriseMailboxAssignmentRepository.create({
      workspaceId: input.workspaceId,
      mailboxProfileId: input.mailboxProfileId,
      workspaceMemberId: input.workspaceMemberId,
      assignedByWorkspaceMemberId: input.assignedByWorkspaceMemberId ?? null,
      assignmentStatus: 'active',
      isPrimaryMailbox: input.isPrimaryMailbox ?? false,
      canReceive: input.canReceive ?? true,
      canSend: input.canSend ?? true,
      canViewSubordinates: input.canViewSubordinates ?? false,
      canHandleSubordinates: input.canHandleSubordinates ?? false,
      canManageRules: input.canManageRules ?? false,
    });

    const savedAssignment =
      await this.enterpriseMailboxAssignmentRepository.save(assignment);

    for (const permissionCode of input.permissionCodes ?? []) {
      const permission = this.enterpriseMailboxPermissionRepository.create({
        workspaceId: input.workspaceId,
        mailboxAssignmentId: savedAssignment.id,
        permissionCode,
        permissionValue: true,
      });

      await this.enterpriseMailboxPermissionRepository.save(permission);
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId: input.workspaceId,
      action: 'enterprise_mailbox_assignment.assign',
      resourceType: 'enterpriseMailboxAssignment',
      resourceId: savedAssignment.id,
      actorWorkspaceMemberId: input.assignedByWorkspaceMemberId ?? null,
      afterJson: {
        mailboxProfileId: savedAssignment.mailboxProfileId,
        workspaceMemberId: savedAssignment.workspaceMemberId,
        permissionCodes: input.permissionCodes ?? [],
      },
    });

    return savedAssignment;
  }
}
