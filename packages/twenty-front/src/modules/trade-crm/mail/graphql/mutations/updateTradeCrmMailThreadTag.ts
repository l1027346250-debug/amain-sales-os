import { gql } from '@apollo/client';

export const UPDATE_TRADE_CRM_MAIL_THREAD_TAG = gql`
  mutation UpdateTradeCrmMailThreadTag(
    $input: UpdateTradeCrmMailThreadTagInput!
  ) {
    updateTradeCrmMailThreadTag(input: $input)
  }
`;
