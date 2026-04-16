type TradeCrmUserLike = {
  canImpersonate?: boolean | null;
  canAccessFullAdminPanel?: boolean | null;
};

export const isTradeCrmManager = (user?: TradeCrmUserLike | null) =>
  Boolean(user?.canImpersonate || user?.canAccessFullAdminPanel);
