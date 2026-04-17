import { gql } from '@apollo/client';

export const CREATE_DEVELOPMENT_EMAIL_AUDIENCE = gql`
  mutation CreateDevelopmentEmailAudience(
    $input: CreateDevelopmentEmailAudienceInput!
  ) {
    createDevelopmentEmailAudience(input: $input) {
      id
      email
      displayName
      subscriptionStatus
      source
      createdAt
    }
  }
`;
