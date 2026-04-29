import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';

export type TradeCrmMailScopeKey =
  | 'mail'
  | 'customer'
  | 'subordinate'
  | 'campaign';

export const TRADE_CRM_MAIL_SCOPE_ORDER: TradeCrmMailScopeKey[] = [
  'mail',
  'customer',
  'subordinate',
  'campaign',
];

export const getTradeCrmMailPath = ({
  scope,
  view,
}: {
  scope: TradeCrmMailScopeKey;
  view?: string;
}) => {
  const searchParams = new URLSearchParams();

  searchParams.set('scope', scope);

  if (view) {
    searchParams.set('view', view);
  }

  return `${tradeCrmRouteMap.mail}?${searchParams.toString()}`;
};
