import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_SEND_TASKS = gql`
  query GetDevelopmentEmailSendTasks($sendJobId: String) {
    getDevelopmentEmailSendTasks(sendJobId: $sendJobId) {
      id
      sendJobId
      campaignId
      audienceId
      templateId
      connectedAccountId
      status
      retryCount
      providerMessageId
      lastError
      scheduledAt
      sentAt
      trackingSnapshot
      createdAt
      updatedAt
    }
  }
`;
