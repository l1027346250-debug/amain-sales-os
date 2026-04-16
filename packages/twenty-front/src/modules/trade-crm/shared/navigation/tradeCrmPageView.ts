import { getTradeCrmScopedViewPath } from '@/trade-crm/navigation/tradeCrmRouteMap';

type TradeCrmPageViewDefinition<TKey extends string> = {
  key: TKey;
  label: string;
};

export const getTradeCrmCurrentView = <
  TKey extends string,
  TView extends TradeCrmPageViewDefinition<TKey>,
>({
  requestedView,
  views,
  fallbackViewKey,
}: {
  requestedView: string | null;
  views: TView[];
  fallbackViewKey: TKey;
}) => {
  const currentViewKey = views.some((view) => view.key === requestedView)
    ? (requestedView as TKey)
    : fallbackViewKey;

  return {
    currentViewKey,
    currentView: views.find((view) => view.key === currentViewKey) ?? views[0],
  };
};

export const getTradeCrmPageTabs = <
  TKey extends string,
  TView extends TradeCrmPageViewDefinition<TKey>,
>({
  route,
  views,
  currentViewKey,
}: {
  route: string;
  views: TView[];
  currentViewKey: TKey;
}) =>
  views.map((view) => ({
    label: view.label,
    isActive: view.key === currentViewKey,
    to: getTradeCrmScopedViewPath(route, view.key),
  }));
