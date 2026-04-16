import { currentUserState } from '@/auth/states/currentUserState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const useDefaultHomePagePath = () => {
  const currentUser = useAtomStateValue(currentUserState);

  return {
    defaultHomePagePath: isDefined(currentUser)
      ? AppPath.TradeCrmWorkbench
      : AppPath.SignInUp,
  };
};
