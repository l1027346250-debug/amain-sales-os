import { useCallback } from 'react';

import { tokenPairState } from '@/auth/states/tokenPairState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getEnterpriseApiUrl } from '@/enterprise/shared/utils/getEnterpriseApiUrl';

export const useEnterpriseApiRequest = () => {
  const tokenPair = useAtomStateValue(tokenPairState);
  const accessToken = tokenPair?.accessOrWorkspaceAgnosticToken.token;
  const hostname = window.location.hostname;
  const isLocalDevelopmentAuthBypass =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  return useCallback(
    (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const shouldUseLocalBypass = isLocalDevelopmentAuthBypass && !accessToken;

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      if (shouldUseLocalBypass) {
        headers.set('x-dev-bypass-auth', 'true');
      }

      return fetch(getEnterpriseApiUrl(path), {
        ...init,
        credentials: shouldUseLocalBypass
          ? 'omit'
          : init?.credentials,
        headers,
      });
    },
    [accessToken, isLocalDevelopmentAuthBypass],
  );
};
