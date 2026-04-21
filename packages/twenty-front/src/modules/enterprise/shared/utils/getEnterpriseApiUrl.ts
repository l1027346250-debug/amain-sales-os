import { REACT_APP_SERVER_BASE_URL } from '~/config';

export const getEnterpriseApiUrl = (path: string) =>
  `${REACT_APP_SERVER_BASE_URL}${path}`;
