import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_REPORTS = gql`
  query GetDevelopmentEmailReports {
    getDevelopmentEmailReports {
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
