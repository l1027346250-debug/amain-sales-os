import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { EnterpriseNavigationSection } from '@/enterprise/navigation/EnterpriseNavigationSection';
import { NavigationDrawerOtherSection } from '@/navigation/components/NavigationDrawerOtherSection';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';
import { TradeCrmNavigationSection } from '@/trade-crm/navigation/TradeCrmNavigationSection';
import { isTradeCrmPath } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { styled } from '@linaria/react';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

import { themeCssVariables } from 'twenty-ui/theme-constants';

const FavoritesSectionDispatcher = lazy(() =>
  import(
    '@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher'
  ).then((module) => ({
    default: module.FavoritesSectionDispatcher,
  })),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import(
    '@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher'
  ).then((module) => ({
    default: module.WorkspaceSectionDispatcher,
  })),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

export const MainNavigationDrawerScrollableItems = () => {
  const location = useLocation();
  const isAmainCrmSurface =
    isTradeCrmPath(location.pathname) ||
    location.pathname.startsWith('/enterprise');

  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <TradeCrmNavigationSection />
      <EnterpriseNavigationSection />
      {isAmainCrmSurface ? null : (
        <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
          <FavoritesSectionDispatcher />
          <WorkspaceSectionDispatcher />
        </Suspense>
      )}
      <NavigationDrawerOtherSection />
    </StyledScrollableItemsContainer>
  );
};
