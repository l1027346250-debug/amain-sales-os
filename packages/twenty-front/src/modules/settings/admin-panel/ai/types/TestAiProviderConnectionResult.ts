export type TestAiProviderConnectionPayload = {
  ok?: boolean;
  checkedEndpoint?: string;
  modelCount?: number;
  sampleModels?: string[];
  warning?: string;
  error?: string;
  status?: number;
  statusText?: string;
  authHeader?: string;
  authMode?: string;
  sdkPackage?: string;
};

export type TestAiProviderConnectionResult = {
  testAiProviderConnection?: TestAiProviderConnectionPayload | null;
};
