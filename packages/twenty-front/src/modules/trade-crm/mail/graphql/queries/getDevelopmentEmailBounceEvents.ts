import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_BOUNCE_EVENTS = gql`
  query GetDevelopmentEmailBounceEvents {
    getDevelopmentEmailBounceEvents {
      id
      eventType
      email
      audienceId
      campaignId
      sendTaskId
      provider
      reason
      occurredAt
      createdAt
    }
  }
`;
