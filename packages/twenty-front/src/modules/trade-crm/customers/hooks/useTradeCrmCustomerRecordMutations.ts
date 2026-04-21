import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

type CustomerRecordMutationResult = {
  record: Record<string, unknown> & {
    id: string;
  };
};

type CreateCustomerMutation = {
  createCustomer: CustomerRecordMutationResult;
};

type UpdateCustomerMutation = {
  updateCustomer: CustomerRecordMutationResult;
};

type CreateCustomerContactMutation = {
  createCustomerContact: CustomerRecordMutationResult;
};

type UpdateCustomerContactMutation = {
  updateCustomerContact: CustomerRecordMutationResult;
};

type CustomerInput = {
  name?: string;
  shortName?: string;
  customerCode?: string;
  country?: string;
  websiteUrl?: string;
  addressLine?: string;
  customerStage?: string;
  customerGroup?: string;
  customerSource?: string;
  customerStar?: string;
  customerScore?: number;
};

type CreateCustomerInput = CustomerInput & {
  name: string;
};

type UpdateCustomerInput = CustomerInput & {
  customerId: string;
};

type CustomerContactInput = {
  nickname?: string;
  email?: string;
  phone?: string;
  position?: string;
  gender?: string;
  birthday?: string;
  facebook?: string;
  twitter?: string;
  linkedIn?: string;
  contactNotes?: string;
};

type CreateCustomerContactInput = CustomerContactInput & {
  customerId: string;
};

type UpdateCustomerContactInput = CustomerContactInput & {
  contactId: string;
};

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      record
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      record
    }
  }
`;

const CREATE_CUSTOMER_CONTACT = gql`
  mutation CreateCustomerContact($input: CreateCustomerContactInput!) {
    createCustomerContact(input: $input) {
      record
    }
  }
`;

const UPDATE_CUSTOMER_CONTACT = gql`
  mutation UpdateCustomerContact($input: UpdateCustomerContactInput!) {
    updateCustomerContact(input: $input) {
      record
    }
  }
`;

export const useTradeCrmCustomerRecordMutations = () => {
  const apolloCoreClient = useApolloCoreClient();
  const [createCustomerMutation, createCustomerState] = useMutation<
    CreateCustomerMutation,
    { input: CreateCustomerInput }
  >(CREATE_CUSTOMER, {
    client: apolloCoreClient,
  });
  const [updateCustomerMutation, updateCustomerState] = useMutation<
    UpdateCustomerMutation,
    { input: UpdateCustomerInput }
  >(UPDATE_CUSTOMER, {
    client: apolloCoreClient,
  });
  const [createCustomerContactMutation, createCustomerContactState] = useMutation<
    CreateCustomerContactMutation,
    { input: CreateCustomerContactInput }
  >(CREATE_CUSTOMER_CONTACT, {
    client: apolloCoreClient,
  });
  const [updateCustomerContactMutation, updateCustomerContactState] = useMutation<
    UpdateCustomerContactMutation,
    { input: UpdateCustomerContactInput }
  >(UPDATE_CUSTOMER_CONTACT, {
    client: apolloCoreClient,
  });

  useSnackBarOnQueryError(createCustomerState.error);
  useSnackBarOnQueryError(updateCustomerState.error);
  useSnackBarOnQueryError(createCustomerContactState.error);
  useSnackBarOnQueryError(updateCustomerContactState.error);

  return {
    createCustomer: async (input: CreateCustomerInput) =>
      (
        await createCustomerMutation({
          variables: {
            input,
          },
        })
      ).data?.createCustomer.record ?? null,
    createCustomerContact: async (input: CreateCustomerContactInput) =>
      (
        await createCustomerContactMutation({
          variables: {
            input,
          },
        })
      ).data?.createCustomerContact.record ?? null,
    createCustomerContactLoading: createCustomerContactState.loading,
    createCustomerLoading: createCustomerState.loading,
    updateCustomer: async (input: UpdateCustomerInput) =>
      (
        await updateCustomerMutation({
          variables: {
            input,
          },
        })
      ).data?.updateCustomer.record ?? null,
    updateCustomerContact: async (input: UpdateCustomerContactInput) =>
      (
        await updateCustomerContactMutation({
          variables: {
            input,
          },
        })
      ).data?.updateCustomerContact.record ?? null,
    updateCustomerContactLoading: updateCustomerContactState.loading,
    updateCustomerLoading: updateCustomerState.loading,
  };
};
