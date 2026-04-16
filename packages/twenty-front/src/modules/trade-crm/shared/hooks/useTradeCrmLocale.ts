import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { APP_LOCALES } from 'twenty-shared/translations';

import { translateTradeCrmText } from '@/trade-crm/shared/i18n/tradeCrmTranslations';

const getFallbackLocale = (): string => {
  try {
    return localStorage.getItem('locale') ?? APP_LOCALES.en;
  } catch {
    return APP_LOCALES.en;
  }
};

export const useTradeCrmLocale = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const locale = currentWorkspaceMember?.locale ?? getFallbackLocale();
  const isChinese = locale.startsWith('zh');

  return {
    locale,
    isChinese,
    tr: (text: string) => translateTradeCrmText(text, isChinese),
  };
};
