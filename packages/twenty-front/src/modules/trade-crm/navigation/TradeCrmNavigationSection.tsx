import { useLocation } from 'react-router-dom';

import { currentUserState } from '@/auth/states/currentUserState';
import { tradeCrmMenuConfig } from '@/trade-crm/navigation/tradeCrmMenuConfig';
import { isTradeCrmManager } from '@/trade-crm/navigation/tradeCrmVisibility';
import { NavigationDrawerItemGroup } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItemGroup';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSubItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSubItem';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';

const isTradeCrmMenuTargetActive = (
  target: string,
  pathname: string,
  search: string,
) => {
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

export const TradeCrmNavigationSection = () => {
  const location = useLocation();
  const currentUser = useAtomStateValue(currentUserState);
  const { tr } = useTradeCrmLocale();
  const canSeeManagerItems = isTradeCrmManager(currentUser);

  const visibleItems = tradeCrmMenuConfig.filter(
    (item) => !item.requiresManager || canSeeManagerItems,
  );

  return (
    <NavigationDrawerSection>
      <NavigationDrawerSectionTitle label={tr('Trade CRM')} />
      {visibleItems.map((item) => {
        const itemActive = isTradeCrmMenuTargetActive(
          item.to,
          location.pathname,
          location.search,
        );

        const visibleChildren =
          item.children?.filter(
            (child) => !child.requiresManager || canSeeManagerItems,
          ) ?? [];
        const activeChildIndex = visibleChildren.findIndex((child) =>
          isTradeCrmMenuTargetActive(child.to, location.pathname, location.search),
        );

        return (
          <NavigationDrawerItemGroup key={item.key}>
            <NavigationDrawerItem
              label={tr(item.label)}
              to={item.to}
              Icon={item.Icon}
              active={itemActive}
            />
            {itemActive &&
              visibleChildren.map((child, index) => {
                const isLastChild = index === visibleChildren.length - 1;
                const childActive = isTradeCrmMenuTargetActive(
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
                    label={tr(child.label)}
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
