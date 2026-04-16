import { gql } from '@apollo/client';

export const TEST_AI_PROVIDER_CONNECTION = gql`
  mutation TestAiProviderConnection(
    $providerName: String
    $providerConfig: JSON
  ) {
    testAiProviderConnection(
      providerName: $providerName
      providerConfig: $providerConfig
    )
  }
`;
