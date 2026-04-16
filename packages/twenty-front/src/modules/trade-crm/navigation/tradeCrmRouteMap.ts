import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const tradeCrmRouteMap = {
  workbench: AppPath.TradeCrmWorkbench,
  prospecting: AppPath.TradeCrmProspecting,
  mail: AppPath.TradeCrmMail,
  customers: AppPath.TradeCrmCustomers,
  opportunities: AppPath.TradeCrmOpportunities,
  collaboration: AppPath.TradeCrmCollaboration,
  analytics: AppPath.TradeCrmAnalytics,
  settings: getSettingsPath(SettingsPath.TradeCrm),
} as const;

export const getTradeCrmScopedViewPath = (
  basePath: string,
  view: string,
) => `${basePath}?view=${view}`;

export const isTradeCrmPath = (pathname: string) =>
  pathname.startsWith('/trade-crm/') || pathname === tradeCrmRouteMap.settings;
