import { gql } from '@apollo/client';

export const EXECUTE_DEVELOPMENT_EMAIL_SEND_JOB = gql`
  mutation ExecuteDevelopmentEmailSendJob(
    $input: ExecuteDevelopmentEmailSendJobInput!
  ) {
    executeDevelopmentEmailSendJob(input: $input) {
      id
      status
      queuedCount
      sentCount
      failedCount
      completedAt
      updatedAt
    }
  }
`;
