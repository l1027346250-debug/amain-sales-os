import { getTradeCrmScopedViewPath } from '@/trade-crm/navigation/tradeCrmRouteMap';

type TradeCrmPageViewDefinition = {
  key: string;
  label: string;
};

export const getTradeCrmCurrentView = <TView extends TradeCrmPageViewDefinition>({
  requestedView,
  views,
  fallbackViewKey,
}: {
  requestedView: string | null;
  views: TView[];
  fallbackViewKey: TView['key'];
}) => {
  const currentViewKey = views.some((view) => view.key === requestedView)
    ? (requestedView as TView['key'])
    : fallbackViewKey;

  return {
    currentViewKey,
    currentView: views.find((view) => view.key === currentViewKey) ?? views[0],
  };
};

export const getTradeCrmPageTabs = <TView extends TradeCrmPageViewDefinition>({
  route,
  views,
  currentViewKey,
}: {
  route: string;
  views: TView[];
  currentViewKey: TView['key'];
}) =>
  views.map((view) => ({
    label: view.label,
    isActive: view.key === currentViewKey,
    to: getTradeCrmScopedViewPath(route, view.key),
  }));
