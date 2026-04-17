import { gql } from '@apollo/client';

export const QUEUE_DEVELOPMENT_EMAIL_CAMPAIGN = gql`
  mutation QueueDevelopmentEmailCampaign(
    $input: QueueDevelopmentEmailCampaignInput!
  ) {
    queueDevelopmentEmailCampaign(input: $input) {
      id
      campaignId
      status
      queuedCount
      sentCount
      failedCount
      createdAt
    }
  }
`;
