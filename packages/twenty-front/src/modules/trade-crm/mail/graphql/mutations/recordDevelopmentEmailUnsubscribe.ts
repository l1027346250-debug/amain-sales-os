import { gql } from '@apollo/client';

export const RECORD_DEVELOPMENT_EMAIL_UNSUBSCRIBE = gql`
  mutation RecordDevelopmentEmailUnsubscribe(
    $input: RecordDevelopmentEmailUnsubscribeInput!
  ) {
    recordDevelopmentEmailUnsubscribe(input: $input) {
      id
      email
      source
      reason
      occurredAt
    }
  }
`;
