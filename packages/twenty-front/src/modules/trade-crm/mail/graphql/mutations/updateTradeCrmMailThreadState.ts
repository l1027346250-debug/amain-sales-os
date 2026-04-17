import { gql } from '@apollo/client';

export const UPDATE_TRADE_CRM_MAIL_THREAD_STATE = gql`
  mutation UpdateTradeCrmMailThreadState(
    $input: UpdateTradeCrmMailThreadStateInput!
  ) {
    updateTradeCrmMailThreadState(input: $input)
  }
`;
