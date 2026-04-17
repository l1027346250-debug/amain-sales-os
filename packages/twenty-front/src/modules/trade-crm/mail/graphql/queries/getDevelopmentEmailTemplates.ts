import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_TEMPLATES = gql`
  query GetDevelopmentEmailTemplates {
    getDevelopmentEmailTemplates {
      id
      name
      subject
      status
      version
      updatedAt
      createdAt
    }
  }
`;
