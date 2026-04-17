import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_SEND_JOBS = gql`
  query GetDevelopmentEmailSendJobs {
    getDevelopmentEmailSendJobs {
      id
      campaignId
      status
      executionMode
      senderPoolMode
      queuedCount
      sentCount
      failedCount
      startedAt
      completedAt
      createdAt
    }
  }
`;
