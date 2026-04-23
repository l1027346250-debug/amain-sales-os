import {
  enterprisePermissionFlagFallbacks,
  type EnterprisePermissionCode,
} from '@/enterprise/shared/constants/enterprisePermissions';
import { usePermissionFlagMap } from '@/settings/roles/hooks/usePermissionFlagMap';
import { PermissionFlagType } from '~/generated-metadata/graphql';

export const useEnterprisePermissions = () => {
  const permissionMap = usePermissionFlagMap();

  const canAccessEnterprise =
    import.meta.env.DEV ||
    permissionMap[PermissionFlagType.WORKSPACE] ||
    permissionMap[PermissionFlagType.ENTERPRISE];

  const hasEnterprisePermission = (
    permissionCode: EnterprisePermissionCode | undefined,
  ) => {
    if (!permissionCode) {
      return canAccessEnterprise;
    }

    if (import.meta.env.DEV || permissionMap[PermissionFlagType.WORKSPACE]) {
      return true;
    }

    return enterprisePermissionFlagFallbacks[permissionCode].some(
      (permissionFlag) => permissionMap[permissionFlag],
    );
  };

  return {
    canAccessEnterprise,
    hasEnterprisePermission,
  };
};
