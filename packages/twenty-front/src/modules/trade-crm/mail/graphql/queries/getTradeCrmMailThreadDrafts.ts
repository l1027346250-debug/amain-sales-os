import { gql } from '@apollo/client';

export const GET_TRADE_CRM_MAIL_THREAD_DRAFTS = gql`
  query GetTradeCrmMailThreadDrafts {
    getTradeCrmMailThreadDrafts {
      id
      threadId
      mode
      customerLabel
      threadTitle
      contextLabel
      contextValue
      recipients
      ccRecipients
      subject
      body
      savedAt
      updatedAt
    }
  }
`;
