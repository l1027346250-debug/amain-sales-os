import { gql } from '@apollo/client';

export const UPDATE_AI_PROVIDER = gql`
  mutation UpdateAiProvider($providerName: String!, $providerConfig: JSON!) {
    updateAiProvider(providerName: $providerName, providerConfig: $providerConfig)
  }
`;
