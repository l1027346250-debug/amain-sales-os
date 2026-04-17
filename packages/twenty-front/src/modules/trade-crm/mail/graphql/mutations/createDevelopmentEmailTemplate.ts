import { gql } from '@apollo/client';

export const CREATE_DEVELOPMENT_EMAIL_TEMPLATE = gql`
  mutation CreateDevelopmentEmailTemplate(
    $input: CreateDevelopmentEmailTemplateInput!
  ) {
    createDevelopmentEmailTemplate(input: $input) {
      id
      name
      subject
      status
      version
      updatedAt
    }
  }
`;
