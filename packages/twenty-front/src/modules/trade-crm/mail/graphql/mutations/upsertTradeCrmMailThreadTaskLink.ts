import { gql } from '@apollo/client';

export const UPSERT_TRADE_CRM_MAIL_THREAD_TASK_LINK = gql`
  mutation UpsertTradeCrmMailThreadTaskLink(
    $input: UpsertTradeCrmMailThreadTaskLinkInput!
  ) {
    upsertTradeCrmMailThreadTaskLink(input: $input)
  }
`;
