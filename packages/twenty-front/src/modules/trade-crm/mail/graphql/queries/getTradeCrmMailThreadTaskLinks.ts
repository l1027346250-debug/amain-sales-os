import { gql } from '@apollo/client';

export const GET_TRADE_CRM_MAIL_THREAD_TASK_LINKS = gql`
  query GetTradeCrmMailThreadTaskLinks($threadIds: [UUID!]!) {
    getTradeCrmMailThreadTaskLinks(threadIds: $threadIds) {
      id
      threadId
      taskId
      updatedAt
    }
  }
`;
