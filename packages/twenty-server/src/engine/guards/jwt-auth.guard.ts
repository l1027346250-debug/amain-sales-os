import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { type RawAuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { bindDataToRequestObject } from 'src/engine/utils/bind-data-to-request-object.util';
import { WorkspaceCacheStorageService } from 'src/engine/workspace-cache-storage/workspace-cache-storage.service';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly workspaceStorageCacheService: WorkspaceCacheStorageService,
    private readonly twentyConfigService: TwentyConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const data =
        await this.accessTokenService.validateTokenByRequest(request);
      const metadataVersion = data.workspace
        ? await this.workspaceStorageCacheService.getMetadataVersion(
            data.workspace.id,
          )
        : undefined;

      if (
        !isDefined(data.apiKey) &&
        !isDefined(data.userWorkspaceId) &&
        !isDefined(data.application)
      ) {
        this.logger.warn(
          `Auth failed: no apiKey, userWorkspaceId, or application in context`,
        );

        return false;
      }

      bindDataToRequestObject(data, request, metadataVersion);

      return true;
    } catch (error) {
      if (await this.tryBindLocalDevelopmentAuthContext(request)) {
        return true;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(`Auth failed: ${errorMessage}`);

      return false;
    }
  }

  private async tryBindLocalDevelopmentAuthContext(
    request: Record<string, any>,
  ): Promise<boolean> {
    const nodeEnv = this.twentyConfigService.get('NODE_ENV');
    const bypassHeader = request.headers?.['x-dev-bypass-auth'];
    const isBypassRequested =
      bypassHeader === 'true' ||
      (Array.isArray(bypassHeader) && bypassHeader.includes('true'));

    if (
      nodeEnv !== NodeEnvironment.DEVELOPMENT ||
      !isBypassRequested ||
      typeof request.path !== 'string' ||
      !(
        request.path.startsWith('/api/enterprise/') ||
        request.path === '/metadata'
      )
    ) {
      return false;
    }

    this.logger.log(
      `Dev auth bypass requested for ${request.method ?? 'UNKNOWN'} ${request.path}`,
    );

    const workspaceRepository = this.dataSource.getRepository(WorkspaceEntity);
    const userWorkspaceRepository =
      this.dataSource.getRepository(UserWorkspaceEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const [workspace] = await workspaceRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!workspace) {
      this.logger.warn(
        'Dev auth bypass failed: no workspace available to bind request context',
      );

      return false;
    }

    const [userWorkspace] = await userWorkspaceRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
      where: { workspaceId: workspace.id },
    });

    const user = userWorkspace?.userId
      ? await userRepository.findOneBy({ id: userWorkspace.userId })
      : null;
    const workspaceMember = await this.findWorkspaceMember({
      schema: workspace.databaseSchema,
      userId: user?.id,
    });

    const metadataVersion =
      await this.workspaceStorageCacheService.getMetadataVersion(workspace.id);

    const rawAuthContext: RawAuthContext = {
      user: user
        ? ({
            id: user.id,
            email: user.email,
          } as RawAuthContext['user'])
        : undefined,
      workspaceMember:
        workspaceMember ?? undefined,
      workspaceMemberId: workspaceMember?.id,
      userWorkspaceId: userWorkspace?.id,
      workspace: {
        id: workspace.id,
      } as RawAuthContext['workspace'],
    };

    bindDataToRequestObject(rawAuthContext, request as any, metadataVersion);

    this.logger.log(
      `Dev auth bypass applied for ${request.method ?? 'UNKNOWN'} ${request.path}`,
    );

    return true;
  }

  private async findWorkspaceMember({
    schema,
    userId,
  }: {
    schema?: string | null;
    userId?: string;
  }): Promise<WorkspaceMemberWorkspaceEntity | null> {
    if (!isDefined(schema) || !isDefined(userId)) {
      return null;
    }

    const workspaceMembers = await this.dataSource.query(
      `
        select
          "id",
          "userId",
          "userEmail",
          "nameFirstName",
          "nameLastName",
          "locale",
          "avatarUrl",
          "timeZone",
          "dateFormat",
          "timeFormat",
          "calendarStartDay",
          "numberFormat",
          "colorScheme"
        from "${schema}"."workspaceMember"
        where "userId" = $1
          and "deletedAt" is null
        order by "createdAt" asc
        limit 1
      `,
      [userId],
    );

    const workspaceMember = workspaceMembers[0];

    if (!workspaceMember) {
      return null;
    }

    return {
      id: workspaceMember.id,
      userId: workspaceMember.userId,
      userEmail: workspaceMember.userEmail,
      locale: workspaceMember.locale,
      avatarUrl: workspaceMember.avatarUrl,
      timeZone: workspaceMember.timeZone,
      dateFormat: workspaceMember.dateFormat,
      timeFormat: workspaceMember.timeFormat,
      calendarStartDay: workspaceMember.calendarStartDay,
      numberFormat: workspaceMember.numberFormat,
      colorScheme: workspaceMember.colorScheme,
      name: {
        firstName: workspaceMember.nameFirstName,
        lastName: workspaceMember.nameLastName,
      },
    } as WorkspaceMemberWorkspaceEntity;
  }
}
