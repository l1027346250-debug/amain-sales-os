import { type ReactNode } from 'react';
import { useHasAccessTokenPair } from '@/auth/hooks/useHasAccessTokenPair';
import { usePermissionFlagMap } from '@/settings/roles/hooks/usePermissionFlagMap';
import { Navigate, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { PermissionFlagType } from '~/generated-metadata/graphql';

export const EnterprisePermissionGuard = ({
  children,
}: {
  children: ReactNode;
}) => {
  const hasAccessTokenPair = useHasAccessTokenPair();
  const location = useLocation();
  const permissionMap = usePermissionFlagMap();

  if (!hasAccessTokenPair) {
    return <Navigate to={AppPath.SignInUp} replace state={{ from: location }} />;
  }

  if (
    !permissionMap[PermissionFlagType.WORKSPACE] &&
    !permissionMap[PermissionFlagType.ENTERPRISE]
  ) {
    return <Navigate to={AppPath.TradeCrmWorkbench} replace />;
  }

  return <>{children}</>;
};
