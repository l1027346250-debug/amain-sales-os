import { useLocation } from 'react-router-dom';

import { currentUserState } from '@/auth/states/currentUserState';
import { enterpriseMenuConfig } from '@/enterprise/navigation/enterpriseMenuConfig';
import { useEnterprisePermissions } from '@/enterprise/shared/hooks/useEnterprisePermissions';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerItemGroup } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItemGroup';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { NavigationDrawerSubItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSubItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { IconBriefcase } from 'twenty-ui/display';

const isTargetActive = (target: string, pathname: string, search: string) => {
  const [targetPathname, targetSearch = ''] = target.split('?');

  if (pathname !== targetPathname && !pathname.startsWith(`${targetPathname}/`)) {
    return false;
  }

  if (!targetSearch) {
    return true;
  }

  const currentParams = new URLSearchParams(search);
  const targetParams = new URLSearchParams(targetSearch);

  return Array.from(targetParams.entries()).every(
    ([key, value]) => currentParams.get(key) === value,
  );
};

export const EnterpriseNavigationSection = () => {
  const location = useLocation();
  const currentUser = useAtomStateValue(currentUserState);
  const { canAccessEnterprise, hasEnterprisePermission } =
    useEnterprisePermissions();

  if (!currentUser || !canAccessEnterprise) {
    return null;
  }

  return (
    <NavigationDrawerSection>
      <NavigationDrawerSectionTitle label="Admin" />
      {enterpriseMenuConfig.map((item) => {
        if (!hasEnterprisePermission(item.requiredPermission)) {
          return null;
        }

        const itemActive = isTargetActive(
          item.to,
          location.pathname,
          location.search,
        );
        const visibleChildren = (item.children ?? []).filter((child) =>
          hasEnterprisePermission(child.requiredPermission),
        );
        const activeChildIndex = visibleChildren.findIndex((child) =>
          isTargetActive(child.to, location.pathname, location.search),
        );

        return (
          <NavigationDrawerItemGroup key={item.key}>
            <NavigationDrawerItem
              label={item.label}
              to={item.to}
              Icon={IconBriefcase}
              active={itemActive}
            />
            {itemActive &&
              visibleChildren.map((child, index) => {
                const isLastChild = index === visibleChildren.length - 1;
                const childActive = isTargetActive(
                  child.to,
                  location.pathname,
                  location.search,
                );
                const subItemState = childActive
                  ? isLastChild
                    ? 'last-selected'
                    : 'intermediate-selected'
                  : isLastChild
                    ? 'last-not-selected'
                    : activeChildIndex !== -1 && index < activeChildIndex
                      ? 'intermediate-before-selected'
                      : 'intermediate-after-selected';

                return (
                  <NavigationDrawerSubItem
                    key={child.key}
                    label={child.label}
                    to={child.to}
                    active={childActive}
                    variant="tertiary"
                    subItemState={subItemState}
                  />
                );
              })}
          </NavigationDrawerItemGroup>
        );
      })}
    </NavigationDrawerSection>
  );
};
