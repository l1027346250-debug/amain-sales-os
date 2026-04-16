import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

type WorkspaceListWorkspaceMembersCommandOptions = {
  workspaceId: string;
  limit?: number;
};

@Command({
  name: 'workspace:list:workspace-members',
  description:
    'List workspaceMember candidates for a workspace so Trade CRM lead automations can be assigned safely',
})
export class WorkspaceListWorkspaceMembersCommand extends CommandRunner {
  private readonly logger = new Logger(
    WorkspaceListWorkspaceMembersCommand.name,
  );

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super();
  }

  @Option({
    flags: '--workspace-id <workspaceId>',
    description: 'Workspace UUID to list workspace members for',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '--limit [limit]',
    description: 'Optional number of workspace members to print',
    required: false,
  })
  parseLimit(value: string): number {
    return Number(value);
  }

  async run(
    _passedParams: string[],
    options: WorkspaceListWorkspaceMembersCommandOptions,
  ): Promise<void> {
    const authContext = buildSystemAuthContext(options.workspaceId);

    const workspaceMembers =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const workspaceMemberRepository =
            await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
              options.workspaceId,
              'workspaceMember',
              { shouldBypassPermissionChecks: true },
            );

          return workspaceMemberRepository.find({
            order: {
              createdAt: 'ASC',
            },
          });
        },
        authContext,
      );

    const limit =
      typeof options.limit === 'number' && Number.isFinite(options.limit)
        ? Math.max(1, Math.floor(options.limit))
        : workspaceMembers.length;

    const candidates = workspaceMembers.slice(0, limit).map((workspaceMember) => ({
      id: workspaceMember.id,
      name: workspaceMember.name,
      userEmail: workspaceMember.userEmail,
      position: workspaceMember.position,
    }));

    this.logger.log(
      `Workspace ${options.workspaceId} has ${workspaceMembers.length} workspace members`,
    );
    this.logger.log(JSON.stringify(candidates, null, 2));
  }
}
