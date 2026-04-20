import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_AUDIENCES = gql`
  query GetDevelopmentEmailAudiences {
    getDevelopmentEmailAudiences {
      id
      email
      displayName
      subscriptionStatus
      source
      companyId
      personId
      createdAt
    }
  }
`;
