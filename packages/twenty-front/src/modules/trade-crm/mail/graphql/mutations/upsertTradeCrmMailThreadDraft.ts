import { gql } from '@apollo/client';

export const UPSERT_TRADE_CRM_MAIL_THREAD_DRAFT = gql`
  mutation UpsertTradeCrmMailThreadDraft(
    $input: UpsertTradeCrmMailThreadDraftInput!
  ) {
    upsertTradeCrmMailThreadDraft(input: $input) {
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
