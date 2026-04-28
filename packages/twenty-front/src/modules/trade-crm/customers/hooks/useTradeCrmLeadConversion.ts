import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

type ConvertLeadToCustomerMutation = {
  convertLeadToCustomer: {
    leadId: string;
    customerId: string;
    contactId: string | null;
    ownerId: string | null;
  };
};

type ConvertLeadToCustomerMutationVariables = {
  input: {
    leadId: string;
  };
};

const CONVERT_LEAD_TO_CUSTOMER = gql`
  mutation ConvertLeadToCustomer($input: ConvertLeadToCustomerInput!) {
    convertLeadToCustomer(input: $input) {
      leadId
      customerId
      contactId
      ownerId
    }
  }
`;

export const useTradeCrmLeadConversion = () => {
  const apolloCoreClient = useApolloCoreClient();
  const [convertLeadToCustomerMutation, { error, loading }] = useMutation<
    ConvertLeadToCustomerMutation,
    ConvertLeadToCustomerMutationVariables
  >(CONVERT_LEAD_TO_CUSTOMER, {
    client: apolloCoreClient,
  });

  useSnackBarOnQueryError(error);

  return {
    convertLeadToCustomer: async (leadId: string) =>
      (
        await convertLeadToCustomerMutation({
          variables: {
            input: {
              leadId,
            },
          },
        })
      ).data?.convertLeadToCustomer ?? null,
    convertLeadToCustomerLoading: loading,
  };
};
