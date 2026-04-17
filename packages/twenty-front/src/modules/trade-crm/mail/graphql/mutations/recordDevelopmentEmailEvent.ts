import { gql } from '@apollo/client';

export const RECORD_DEVELOPMENT_EMAIL_EVENT = gql`
  mutation RecordDevelopmentEmailEvent(
    $input: RecordDevelopmentEmailEventInput!
  ) {
    recordDevelopmentEmailEvent(input: $input) {
      id
      eventType
      email
      provider
      providerMessageId
      occurredAt
    }
  }
`;
