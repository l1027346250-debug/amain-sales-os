import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_WORKSPACE = gql`
  query GetDevelopmentEmailWorkspace {
    getDevelopmentEmailWorkspace {
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
