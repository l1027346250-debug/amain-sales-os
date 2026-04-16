import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

type WorkspaceBackfillWorkspaceMembersCommandOptions = {
  workspaceId: string;
};

@Command({
  name: 'workspace:backfill:workspace-members',
  description:
    'Backfill missing workspaceMember records from existing core.userWorkspace memberships',
})
export class WorkspaceBackfillWorkspaceMembersCommand extends CommandRunner {
  private readonly logger = new Logger(
    WorkspaceBackfillWorkspaceMembersCommand.name,
  );

  constructor(
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userWorkspaceService: UserWorkspaceService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super();
  }

  @Option({
    flags: '--workspace-id <workspaceId>',
    description: 'Workspace UUID to backfill workspace members for',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: WorkspaceBackfillWorkspaceMembersCommandOptions,
  ): Promise<void> {
    const authContext = buildSystemAuthContext(options.workspaceId);

    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: {
        workspaceId: options.workspaceId,
      },
      select: {
        userId: true,
      },
    });

    const workspaceUserIds = Array.from(
      new Set(userWorkspaces.map(({ userId }) => userId)),
    );

    if (workspaceUserIds.length === 0) {
      this.logger.warn(
        `No userWorkspace records found for workspace ${options.workspaceId}`,
      );

      return;
    }

    const existingWorkspaceMemberUserIds =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const workspaceMemberRepository =
            await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
              options.workspaceId,
              'workspaceMember',
              { shouldBypassPermissionChecks: true },
            );

          const workspaceMembers = await workspaceMemberRepository.find({
            select: {
              userId: true,
            },
          });

          return new Set(workspaceMembers.map(({ userId }) => userId));
        },
        authContext,
      );

    const missingUserIds = workspaceUserIds.filter(
      (userId) => !existingWorkspaceMemberUserIds.has(userId),
    );

    if (missingUserIds.length === 0) {
      this.logger.log(
        `Workspace ${options.workspaceId} already has workspaceMember records for all ${workspaceUserIds.length} users`,
      );

      return;
    }

    const users = await this.userRepository.find({
      where: {
        id: In(missingUserIds),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        locale: true,
      },
    });

    const usersById = new Map(users.map((user) => [user.id, user]));
    let createdCount = 0;
    let skippedCount = 0;

    for (const userId of missingUserIds) {
      const user = usersById.get(userId);

      if (!user) {
        skippedCount += 1;
        this.logger.warn(
          `Skipping workspaceMember backfill for missing user ${userId} in workspace ${options.workspaceId}`,
        );

        continue;
      }

      await this.userWorkspaceService.createWorkspaceMember(
        options.workspaceId,
        user,
      );
      createdCount += 1;
    }

    this.logger.log(
      `Workspace ${options.workspaceId} workspaceMember backfill complete: created ${createdCount}, skipped ${skippedCount}, total memberships ${workspaceUserIds.length}`,
    );
  }
}
