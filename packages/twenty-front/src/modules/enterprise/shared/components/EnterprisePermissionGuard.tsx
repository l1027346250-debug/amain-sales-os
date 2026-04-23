import { type ReactNode } from 'react';
import { useHasAccessTokenPair } from '@/auth/hooks/useHasAccessTokenPair';
import { type EnterprisePermissionCode } from '@/enterprise/shared/constants/enterprisePermissions';
import { useEnterprisePermissions } from '@/enterprise/shared/hooks/useEnterprisePermissions';
import { Navigate, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

export const EnterprisePermissionGuard = ({
  children,
  requiredPermission,
}: {
  children: ReactNode;
  requiredPermission?: EnterprisePermissionCode;
}) => {
  const hasAccessTokenPair = useHasAccessTokenPair();
  const location = useLocation();
  const { hasEnterprisePermission } = useEnterprisePermissions();

  if (!hasAccessTokenPair) {
    return <Navigate to={AppPath.SignInUp} replace state={{ from: location }} />;
  }

  if (!hasEnterprisePermission(requiredPermission)) {
    return <Navigate to={AppPath.TradeCrmWorkbench} replace />;
  }

  return <>{children}</>;
};
