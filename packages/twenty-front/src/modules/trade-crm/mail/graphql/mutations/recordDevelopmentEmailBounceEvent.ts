import { gql } from '@apollo/client';

export const RECORD_DEVELOPMENT_EMAIL_BOUNCE_EVENT = gql`
  mutation RecordDevelopmentEmailBounceEvent(
    $input: RecordDevelopmentEmailBounceEventInput!
  ) {
    recordDevelopmentEmailBounceEvent(input: $input) {
      id
      eventType
      email
      reason
      occurredAt
    }
  }
`;
