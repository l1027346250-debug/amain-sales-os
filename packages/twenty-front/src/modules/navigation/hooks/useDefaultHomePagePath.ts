import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const useDefaultHomePagePath = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const hostname = window.location.hostname;
  const isLocalDevelopmentAuthBypass =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  return {
    defaultHomePagePath: isLocalDevelopmentAuthBypass
      ? AppPath.TradeCrmWorkbench
      : isDefined(currentUser)
      ? AppPath.TradeCrmWorkbench
      : AppPath.SignInUp,
  };
};
