import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_ANALYTICS = gql`
  query GetDevelopmentEmailAnalytics {
    getDevelopmentEmailAnalytics {
      metrics {
        label
        value
        description
      }
      listItems {
        id
        primary
        secondary
        tertiary
        meta
        status
      }
    }
  }
`;
