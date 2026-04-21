import { useCallback } from 'react';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getEnterpriseApiUrl } from '@/enterprise/shared/utils/getEnterpriseApiUrl';

export const useEnterpriseApiRequest = () => {
  const tokenPair = useAtomStateValue(tokenPairState);
  const accessToken = tokenPair?.accessOrWorkspaceAgnosticToken.token;

  return useCallback(
    (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return fetch(getEnterpriseApiUrl(path), {
        ...init,
        headers,
      });
    },
    [accessToken],
  );
};
