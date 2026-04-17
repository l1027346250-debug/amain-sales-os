import { gql } from '@apollo/client';

export const GET_DEVELOPMENT_EMAIL_SEND_JOB_SUMMARY = gql`
  query GetDevelopmentEmailSendJobSummary($sendJobId: String!) {
    getDevelopmentEmailSendJobSummary(sendJobId: $sendJobId) {
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
