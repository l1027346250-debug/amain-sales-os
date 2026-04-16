const getDefaultIntegrationHubApiBaseUrl = () => {
  if (
    window.location.hostname.endsWith('localhost') ||
    window.location.hostname.endsWith('127.0.0.1')
  ) {
    return `http://${window.location.hostname}:3020/api`;
  }

  return null;
};

export const getIntegrationHubApiBaseUrl = () => {
  return (
    window._env_?.REACT_APP_INTEGRATION_HUB_API_BASE_URL ||
    process.env.REACT_APP_INTEGRATION_HUB_API_BASE_URL ||
    getDefaultIntegrationHubApiBaseUrl()
  );
};
