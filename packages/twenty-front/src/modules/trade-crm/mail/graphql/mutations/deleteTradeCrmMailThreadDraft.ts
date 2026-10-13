import { gql } from '@apollo/client';

export const DELETE_TRADE_CRM_MAIL_THREAD_DRAFT = gql`
  mutation DeleteTradeCrmMailThreadDraft($draftId: UUID!) {
    deleteTradeCrmMailThreadDraft(draftId: $draftId)
  }
`;
