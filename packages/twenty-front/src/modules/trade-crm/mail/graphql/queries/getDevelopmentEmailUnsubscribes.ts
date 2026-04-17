import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_UNSUBSCRIBES = gql`
  query GetDevelopmentEmailUnsubscribes {
    getDevelopmentEmailUnsubscribes {
      id
      email
      audienceId
      campaignId
      sendTaskId
      source
      reason
      occurredAt
      createdAt
    }
  }
`;
