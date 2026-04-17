import { gql } from '@apollo/client';

export const START_DEVELOPMENT_EMAIL_SEND_JOB = gql`
  mutation StartDevelopmentEmailSendJob(
    $input: StartDevelopmentEmailSendJobInput!
  ) {
    startDevelopmentEmailSendJob(input: $input) {
      id
      status
      queuedCount
      sentCount
      failedCount
      startedAt
      updatedAt
    }
  }
`;
