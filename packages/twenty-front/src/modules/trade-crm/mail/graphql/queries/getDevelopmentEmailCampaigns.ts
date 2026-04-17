import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_CAMPAIGNS = gql`
  query GetDevelopmentEmailCampaigns {
    getDevelopmentEmailCampaigns {
      id
      name
      templateId
      status
      scheduledAt
      startedAt
      completedAt
      createdAt
    }
  }
`;
