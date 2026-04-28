import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { type Request, type Response } from 'express';
import { FeatureFlagKey } from 'twenty-shared/types';
import { type APP_LOCALES, SOURCE_LOCALE } from 'twenty-shared/translations';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { AuthException } from 'src/engine/core-modules/auth/auth.exception';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { type RawAuthContext } from 'src/engine/core-modules/auth/types/auth-context.type';
import { getAuthExceptionRestStatus } from 'src/engine/core-modules/auth/utils/get-auth-exception-rest-status.util';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { ErrorCode } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { JwtWrapperService } from 'src/engine/core-modules/jwt/services/jwt-wrapper.service';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { DataSourceService } from 'src/engine/metadata-modules/data-source/data-source.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { INTERNAL_SERVER_ERROR } from 'src/engine/middlewares/constants/default-error-message.constant';
import { bindDataToRequestObject } from 'src/engine/utils/bind-data-to-request-object.util';
import {
  handleException,
  handleExceptionAndConvertToGraphQLError,
} from 'src/engine/utils/global-exception-handler.util';
import { WorkspaceCacheStorageService } from 'src/engine/workspace-cache-storage/workspace-cache-storage.service';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
import { type CustomException } from 'src/utils/custom-exception';

@Injectable()
export class MiddlewareService {
  private readonly logger = new Logger(MiddlewareService.name);

  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly workspaceStorageCacheService: WorkspaceCacheStorageService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly dataSourceService: DataSourceService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
    private readonly jwtWrapperService: JwtWrapperService,
    private readonly twentyConfigService: TwentyConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  public isTokenPresent(request: Request): boolean {
    const token = this.jwtWrapperService.extractJwtFromRequest()(request);

    return !!token;
  }

  // oxlint-disable-next-line @typescripttypescript/no-explicit-any
  public writeRestResponseOnExceptionCaught(res: Response, error: any) {
    const statusCode = this.getStatus(error);

    // capture and handle custom exceptions
    handleException({
      exception: error as CustomException,
      exceptionHandlerService: this.exceptionHandlerService,
      statusCode,
    });

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.write(
      JSON.stringify({
        statusCode,
        messages: [error?.message || INTERNAL_SERVER_ERROR],
        error: error?.code || ErrorCode.INTERNAL_SERVER_ERROR,
      }),
    );

    res.end();
  }

  // oxlint-disable-next-line @typescripttypescript/no-explicit-any
  public writeGraphqlResponseOnExceptionCaught(res: Response, error: any) {
    let errors;

    if (error instanceof AuthException) {
      try {
        const authFilter = new AuthGraphqlApiExceptionFilter();

        authFilter.catch(error);
      } catch (transformedError) {
        errors = [transformedError];
      }
    } else {
      errors = [
        handleExceptionAndConvertToGraphQLError(
          error as Error,
          this.exceptionHandlerService,
        ),
      ];
    }

    const statusCode = 200;

    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
    });

    res.write(
      JSON.stringify({
        errors,
      }),
    );

    res.end();
  }

  public async hydrateRestRequest(request: Request) {
    try {
      const data = await this.accessTokenService.validateTokenByRequest(request);
      const metadataVersion = data.workspace
        ? await this.workspaceStorageCacheService.getMetadataVersion(
            data.workspace.id,
          )
        : undefined;

      if (!data.workspace) {
        throw new Error('No data sources found');
      }

      const isDataSourceMigrated =
        await this.featureFlagService.isFeatureEnabled(
          FeatureFlagKey.IS_DATASOURCE_MIGRATED,
          data.workspace.id,
        );

      const hasSchema = isDataSourceMigrated
        ? isNonEmptyString(data.workspace.databaseSchema)
        : (
            await this.dataSourceService.getDataSourcesMetadataFromWorkspaceId(
              data.workspace.id,
            )
          ).length > 0;

      if (!hasSchema) {
        throw new Error('No data sources found');
      }

      bindDataToRequestObject(data, request, metadataVersion);
    } catch (error) {
      if (await this.tryBindLocalDevelopmentAuthContext(request)) {
        this.logger.log(
          `Dev REST auth context bound for ${request.method} ${request.path}`,
        );

        return;
      }

      throw error;
    }
  }

  public async hydrateGraphqlRequest(request: Request) {
    if (!this.isTokenPresent(request)) {
      if (await this.tryBindLocalDevelopmentAuthContext(request)) {
        this.logger.log(
          `Dev GraphQL auth context bound for ${request.method} ${request.path}`,
        );

        return;
      }

      request.locale =
        (request.headers['x-locale'] as keyof typeof APP_LOCALES) ??
        SOURCE_LOCALE;

      return;
    }

    const data = await this.accessTokenService.validateTokenByRequest(request);
    const metadataVersion = data.workspace
      ? await this.workspaceStorageCacheService.getMetadataVersion(
          data.workspace.id,
        )
      : undefined;

    bindDataToRequestObject(data, request, metadataVersion);
  }

  private async tryBindLocalDevelopmentAuthContext(
    request: Request,
  ): Promise<boolean> {
    const nodeEnv = this.twentyConfigService.get('NODE_ENV');
    const bypassHeader = request.headers['x-dev-bypass-auth'];
    const isBypassRequested =
      bypassHeader === 'true' ||
      (Array.isArray(bypassHeader) && bypassHeader.includes('true'));

    if (
      nodeEnv !== NodeEnvironment.DEVELOPMENT ||
      !isBypassRequested ||
      !(
        request.path === '/metadata' ||
        request.path === '/graphql' ||
        request.path.startsWith('/api/enterprise/')
      )
    ) {
      return false;
    }

    const workspaceRepository = this.dataSource.getRepository(WorkspaceEntity);
    const userWorkspaceRepository =
      this.dataSource.getRepository(UserWorkspaceEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const [workspace] = await workspaceRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!workspace) {
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
        displayName: workspace.displayName,
        activationStatus: workspace.activationStatus,
        allowImpersonation: workspace.allowImpersonation,
        isPublicInviteLinkEnabled: workspace.isPublicInviteLinkEnabled,
        trashRetentionDays: workspace.trashRetentionDays,
        eventLogRetentionDays: workspace.eventLogRetentionDays,
        metadataVersion,
      } as RawAuthContext['workspace'],
    };

    bindDataToRequestObject(rawAuthContext, request, metadataVersion);

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

  private hasErrorStatus(error: unknown): error is { status: number } {
    return isDefined((error as { status: number })?.status);
  }

  // oxlint-disable-next-line @typescripttypescript/no-explicit-any
  private getStatus(error: any): number {
    if (this.hasErrorStatus(error)) {
      return error.status;
    }

    if (error instanceof AuthException) {
      return getAuthExceptionRestStatus(error);
    }

    return 500;
  }
}
