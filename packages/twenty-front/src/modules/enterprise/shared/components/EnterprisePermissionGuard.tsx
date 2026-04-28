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
  const hostname = window.location.hostname;
  const isLocalDevelopmentAuthBypass =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';
  const hasPermission = hasEnterprisePermission(requiredPermission);

  if (isLocalDevelopmentAuthBypass) {
    // eslint-disable-next-line no-console
    console.log('enterprise-guard', {
      hasAccessTokenPair,
      hasPermission,
      pathname: location.pathname,
      requiredPermission,
    });
  }

  if (!hasAccessTokenPair && !isLocalDevelopmentAuthBypass) {
    return <Navigate to={AppPath.SignInUp} replace state={{ from: location }} />;
  }

  if (!hasPermission) {
    return <Navigate to={AppPath.TradeCrmWorkbench} replace />;
  }

  return <>{children}</>;
};
