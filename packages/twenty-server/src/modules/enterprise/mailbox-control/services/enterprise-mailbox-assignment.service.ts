import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

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

type UpdateEnterpriseMailboxAssignmentInput = {
  id: string;
  workspaceId: string;
  updatedByWorkspaceMemberId?: string | null;
  assignmentStatus?: string;
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

  private async assertPrimaryMailboxConflict(input: {
    workspaceId: string;
    workspaceMemberId: string;
    mailboxAssignmentIdToExclude?: string;
    isPrimaryMailbox: boolean;
    assignmentStatus: string;
  }) {
    if (!input.isPrimaryMailbox || input.assignmentStatus !== 'active') {
      return;
    }

    const existingAssignments = await this.enterpriseMailboxAssignmentRepository.find({
      where: {
        workspaceId: input.workspaceId,
        workspaceMemberId: input.workspaceMemberId,
      },
    });

    const conflictingPrimaryMailboxAssignment = existingAssignments.find(
      (mailboxAssignment) =>
        mailboxAssignment.id !== input.mailboxAssignmentIdToExclude &&
        mailboxAssignment.assignmentStatus === 'active' &&
        mailboxAssignment.isPrimaryMailbox,
    );

    if (conflictingPrimaryMailboxAssignment) {
      throw new BadRequestException(
        'Workspace member already has an active primary mailbox assignment',
      );
    }
  }

  async assignMailbox(input: AssignEnterpriseMailboxInput) {
    await this.enterpriseMailboxProfileRepository.findOneByOrFail({
      id: input.mailboxProfileId,
      workspaceId: input.workspaceId,
    });

    await this.assertPrimaryMailboxConflict({
      workspaceId: input.workspaceId,
      workspaceMemberId: input.workspaceMemberId,
      isPrimaryMailbox: input.isPrimaryMailbox ?? false,
      assignmentStatus: 'active',
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

  async updateMailboxAssignment(input: UpdateEnterpriseMailboxAssignmentInput) {
    const assignment =
      await this.enterpriseMailboxAssignmentRepository.findOneByOrFail({
        id: input.id,
        workspaceId: input.workspaceId,
      });

    const existingPermissions = await this.enterpriseMailboxPermissionRepository.find({
      where: {
        mailboxAssignmentId: assignment.id,
        workspaceId: input.workspaceId,
      },
    });

    const beforeSnapshot = {
      assignmentStatus: assignment.assignmentStatus,
      isPrimaryMailbox: assignment.isPrimaryMailbox,
      canReceive: assignment.canReceive,
      canSend: assignment.canSend,
      canViewSubordinates: assignment.canViewSubordinates,
      canHandleSubordinates: assignment.canHandleSubordinates,
      canManageRules: assignment.canManageRules,
      permissionCodes: existingPermissions.map((permission) => permission.permissionCode),
    };

    const nextAssignmentStatus = input.assignmentStatus ?? assignment.assignmentStatus;
    const nextIsPrimaryMailbox = input.isPrimaryMailbox ?? assignment.isPrimaryMailbox;

    await this.assertPrimaryMailboxConflict({
      workspaceId: input.workspaceId,
      workspaceMemberId: assignment.workspaceMemberId,
      mailboxAssignmentIdToExclude: assignment.id,
      isPrimaryMailbox: nextIsPrimaryMailbox,
      assignmentStatus: nextAssignmentStatus,
    });

    if (input.assignmentStatus !== undefined) {
      assignment.assignmentStatus = input.assignmentStatus;
    }

    if (input.isPrimaryMailbox !== undefined) {
      assignment.isPrimaryMailbox = input.isPrimaryMailbox;
    }

    if (input.canReceive !== undefined) {
      assignment.canReceive = input.canReceive;
    }

    if (input.canSend !== undefined) {
      assignment.canSend = input.canSend;
    }

    if (input.canViewSubordinates !== undefined) {
      assignment.canViewSubordinates = input.canViewSubordinates;
    }

    if (input.canHandleSubordinates !== undefined) {
      assignment.canHandleSubordinates = input.canHandleSubordinates;
    }

    if (input.canManageRules !== undefined) {
      assignment.canManageRules = input.canManageRules;
    }

    const savedAssignment =
      await this.enterpriseMailboxAssignmentRepository.save(assignment);

    if (input.permissionCodes !== undefined) {
      await this.enterpriseMailboxPermissionRepository.delete({
        mailboxAssignmentId: assignment.id,
        workspaceId: input.workspaceId,
      });

      for (const permissionCode of input.permissionCodes) {
        const permission = this.enterpriseMailboxPermissionRepository.create({
          workspaceId: input.workspaceId,
          mailboxAssignmentId: assignment.id,
          permissionCode,
          permissionValue: true,
        });

        await this.enterpriseMailboxPermissionRepository.save(permission);
      }
    }

    await this.enterpriseConfigAuditService.createLog({
      workspaceId: input.workspaceId,
      action: 'enterprise_mailbox_assignment.update',
      resourceType: 'enterpriseMailboxAssignment',
      resourceId: savedAssignment.id,
      actorWorkspaceMemberId: input.updatedByWorkspaceMemberId ?? null,
      beforeJson: beforeSnapshot,
      afterJson: {
        assignmentStatus: savedAssignment.assignmentStatus,
        isPrimaryMailbox: savedAssignment.isPrimaryMailbox,
        canReceive: savedAssignment.canReceive,
        canSend: savedAssignment.canSend,
        canViewSubordinates: savedAssignment.canViewSubordinates,
        canHandleSubordinates: savedAssignment.canHandleSubordinates,
        canManageRules: savedAssignment.canManageRules,
        permissionCodes: input.permissionCodes ?? beforeSnapshot.permissionCodes,
      },
    });

    return savedAssignment;
  }

  async findMany(workspaceId: string) {
    const assignments = await this.enterpriseMailboxAssignmentRepository.find({
      order: { updatedAt: 'DESC' },
      where: { workspaceId },
    });

    const mailboxProfileIds = Array.from(
      new Set(assignments.map((assignment) => assignment.mailboxProfileId)),
    );
    const assignmentIds = assignments.map((assignment) => assignment.id);

    const [mailboxProfiles, mailboxPermissions] = await Promise.all([
      mailboxProfileIds.length === 0
        ? Promise.resolve([])
        : this.enterpriseMailboxProfileRepository.find({
            where: {
              id: In(mailboxProfileIds),
              workspaceId,
            },
          }),
      assignmentIds.length === 0
        ? Promise.resolve([])
        : this.enterpriseMailboxPermissionRepository.find({
            where: {
              mailboxAssignmentId: In(assignmentIds),
              workspaceId,
            },
          }),
    ]);

    const mailboxProfilesById = new Map(
      mailboxProfiles.map((mailboxProfile) => [mailboxProfile.id, mailboxProfile]),
    );
    const permissionCodesByAssignmentId = mailboxPermissions.reduce<
      Record<string, string[]>
    >((result, mailboxPermission) => {
      result[mailboxPermission.mailboxAssignmentId] = [
        ...(result[mailboxPermission.mailboxAssignmentId] ?? []),
        mailboxPermission.permissionCode,
      ];

      return result;
    }, {});

    return assignments.map((assignment) => ({
      ...assignment,
      emailAddress:
        mailboxProfilesById.get(assignment.mailboxProfileId)?.emailAddress ?? null,
      permissionCodes: permissionCodesByAssignmentId[assignment.id] ?? [],
    }));
  }
}
