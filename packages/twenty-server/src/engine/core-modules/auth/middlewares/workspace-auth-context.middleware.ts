import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';

import { type NextFunction, type Request, type Response } from 'express';
import { isDefined } from 'twenty-shared/utils';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { withWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { buildApiKeyAuthContext } from 'src/engine/core-modules/auth/utils/build-api-key-auth-context.util';
import { buildApplicationAuthContext } from 'src/engine/core-modules/auth/utils/build-application-auth-context.util';
import { buildPendingActivationUserAuthContext } from 'src/engine/core-modules/auth/utils/build-pending-activation-user-auth-context.util';
import { buildUserAuthContext } from 'src/engine/core-modules/auth/utils/build-user-auth-context.util';

@Injectable()
export class WorkspaceAuthContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WorkspaceAuthContextMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction) {
    if (!isDefined(req.workspace)) {
      next();

      return;
    }

    if (
      req.headers['x-dev-bypass-auth'] === 'true' ||
      (Array.isArray(req.headers['x-dev-bypass-auth']) &&
        req.headers['x-dev-bypass-auth'].includes('true'))
    ) {
      this.logger.log(
        `Building workspace auth context for ${req.method} ${req.path} (hasUser=${isDefined(req.user)}, hasUserWorkspaceId=${isDefined(req.userWorkspaceId)}, hasApplication=${isDefined(req.application)}, hasApiKey=${isDefined(req.apiKey)})`,
      );
    }

    const authContext = this.buildAuthContext(req);

    if (
      req.headers['x-dev-bypass-auth'] === 'true' ||
      (Array.isArray(req.headers['x-dev-bypass-auth']) &&
        req.headers['x-dev-bypass-auth'].includes('true'))
    ) {
      this.logger.log(
        `Workspace auth context ready for ${req.method} ${req.path} as ${authContext.type}`,
      );
    }

    withWorkspaceAuthContext(authContext, () => {
      next();
    });
  }

  private buildAuthContext(req: Request): WorkspaceAuthContext {
    if (isDefined(req.apiKey)) {
      return buildApiKeyAuthContext({
        workspace: req.workspace!,
        apiKey: req.apiKey,
      });
    }

    if (
      isDefined(req.userWorkspaceId) &&
      isDefined(req.workspaceMemberId) &&
      isDefined(req.workspaceMember) &&
      isDefined(req.user)
    ) {
      return buildUserAuthContext({
        workspace: req.workspace!,
        userWorkspaceId: req.userWorkspaceId,
        user: req.user,
        workspaceMemberId: req.workspaceMemberId,
        workspaceMember: req.workspaceMember,
      });
    }

    if (isDefined(req.application)) {
      return buildApplicationAuthContext({
        workspace: req.workspace!,
        application: req.application,
      });
    }

    if (isDefined(req.userWorkspaceId) && isDefined(req.user)) {
      return buildPendingActivationUserAuthContext({
        workspace: req.workspace!,
        userWorkspaceId: req.userWorkspaceId,
        user: req.user,
      });
    }

    throw new AuthException(
      'No authentication context found',
      AuthExceptionCode.UNAUTHENTICATED,
    );
  }
}
