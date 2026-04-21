import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';

import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';

export type TradeCrmCustomerImportJobItem = {
  id: string;
  fileName: string;
  destination: string;
  updateExistingContacts: boolean;
  selectedFields: string[];
  status: string;
  successCount: number;
  failedCount: number;
  executedAt: string | null;
};

type CustomerImportJobsQuery = {
  customerImportJobs: {
    jobs: TradeCrmCustomerImportJobItem[];
    totalCount: number;
  };
};

type CustomerImportJobsQueryVariables = {
  limit?: number;
};

type StartCustomerImportJobMutation = {
  startCustomerImportJob: TradeCrmCustomerImportJobItem;
};

type StartCustomerImportJobMutationVariables = {
  input: {
    fileName: string;
    destination: string;
    updateExistingContacts: boolean;
    selectedFields: string[];
  };
};

const GET_CUSTOMER_IMPORT_JOBS = gql`
  query GetCustomerImportJobs($limit: Int) {
    customerImportJobs(limit: $limit) {
      totalCount
      jobs {
        id
        fileName
        destination
        updateExistingContacts
        selectedFields
        status
        successCount
        failedCount
        executedAt
      }
    }
  }
`;

const START_CUSTOMER_IMPORT_JOB = gql`
  mutation StartCustomerImportJob($input: StartCustomerImportJobInput!) {
    startCustomerImportJob(input: $input) {
      id
      fileName
      destination
      updateExistingContacts
      selectedFields
      status
      successCount
      failedCount
      executedAt
    }
  }
`;

export const useTradeCrmCustomerImportJobs = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { data, error, loading, refetch } = useQuery<
    CustomerImportJobsQuery,
    CustomerImportJobsQueryVariables
  >(GET_CUSTOMER_IMPORT_JOBS, {
    client: apolloCoreClient,
    errorPolicy: 'all',
    variables: {
      limit: 20,
    },
  });
  const [startCustomerImportJobMutation, { error: startError, loading: startLoading }] =
    useMutation<
      StartCustomerImportJobMutation,
      StartCustomerImportJobMutationVariables
    >(START_CUSTOMER_IMPORT_JOB, {
      client: apolloCoreClient,
    });

  useSnackBarOnQueryError(error);
  useSnackBarOnQueryError(startError);

  const startCustomerImportJob = async (
    input: StartCustomerImportJobMutationVariables['input'],
  ) => {
    const result = await startCustomerImportJobMutation({
      variables: {
        input,
      },
    });

    await refetch({
      limit: 20,
    });

    return result.data?.startCustomerImportJob ?? null;
  };

  return {
    jobs: data?.customerImportJobs.jobs ?? [],
    loading,
    startCustomerImportJob,
    startLoading,
    totalCount: data?.customerImportJobs.totalCount ?? 0,
  };
};
