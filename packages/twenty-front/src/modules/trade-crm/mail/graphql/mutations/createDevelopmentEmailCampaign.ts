import { gql } from '@apollo/client';

export const CREATE_DEVELOPMENT_EMAIL_CAMPAIGN = gql`
  mutation CreateDevelopmentEmailCampaign(
    $input: CreateDevelopmentEmailCampaignInput!
  ) {
    createDevelopmentEmailCampaign(input: $input) {
      id
      name
      templateId
      status
      scheduledAt
      createdAt
    }
  }
`;
