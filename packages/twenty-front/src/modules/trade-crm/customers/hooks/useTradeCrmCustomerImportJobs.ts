import { gql } from '@apollo/client';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';

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

export type TradeCrmCustomerImportRowItem = {
  id: string;
  rowLabel: string;
  rowNumber: number;
  companyName: string | null;
  contactEmail: string | null;
  status: string;
  errorMessage: string | null;
};

export type TradeCrmCustomerImportJobResult = {
  job: TradeCrmCustomerImportJobItem | null;
  rows: TradeCrmCustomerImportRowItem[];
};

type CustomerImportJobsQuery = {
  customerImportJobsOverview: {
    jobs: TradeCrmCustomerImportJobItem[];
    totalCount: number;
  };
};

type CustomerImportJobResultQuery = {
  customerImportJobResult: TradeCrmCustomerImportJobResult;
};

type CustomerImportJobsQueryVariables = {
  limit?: number;
};

type CustomerImportJobResultQueryVariables = {
  jobId: string;
};

type StartCustomerImportJobMutation = {
  startCustomerImportJob: TradeCrmCustomerImportJobItem;
};

type SaveCustomerImportMappingMutation = {
  saveCustomerImportMapping: TradeCrmCustomerImportJobItem;
};

type CommitCustomerImportJobMutation = {
  commitCustomerImportJob: {
    job: TradeCrmCustomerImportJobItem | null;
    rows: Array<{
      id: string;
      rowLabel: string;
      rowNumber: number;
      companyName: string | null;
      contactEmail: string | null;
      status: string;
      errorMessage: string | null;
    }>;
  };
};

type StartCustomerImportJobMutationVariables = {
  input: {
    fileName: string;
    destination: string;
    updateExistingContacts: boolean;
    selectedFields: string[];
  };
};

type SaveCustomerImportMappingMutationVariables = {
  input: {
    jobId: string;
    mappedFields: string[];
  };
};

type CommitCustomerImportJobMutationVariables = {
  input: {
    jobId: string;
  };
};

const GET_CUSTOMER_IMPORT_JOBS = gql`
  query GetCustomerImportJobs($limit: Int) {
    customerImportJobsOverview(limit: $limit) {
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

const GET_CUSTOMER_IMPORT_JOB_RESULT = gql`
  query GetCustomerImportJobResult($jobId: UUID!) {
    customerImportJobResult(jobId: $jobId) {
      job {
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
      rows {
        id
        rowLabel
        rowNumber
        companyName
        contactEmail
        status
        errorMessage
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

const SAVE_CUSTOMER_IMPORT_MAPPING = gql`
  mutation SaveCustomerImportMapping($input: SaveCustomerImportMappingInput!) {
    saveCustomerImportMapping(input: $input) {
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

const COMMIT_CUSTOMER_IMPORT_JOB = gql`
  mutation CommitCustomerImportJob($input: CommitCustomerImportJobInput!) {
    commitCustomerImportJob(input: $input) {
      job {
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
      rows {
        id
        rowLabel
        rowNumber
        companyName
        contactEmail
        status
        errorMessage
      }
    }
  }
`;

export const useTradeCrmCustomerImportJobs = () => {
  const apolloCoreClient = useApolloCoreClient();
  const [activeResult, setActiveResult] =
    useState<TradeCrmCustomerImportJobResult | null>(null);
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
  const [
    getCustomerImportJobResultQuery,
    { error: resultError, loading: resultLoading },
  ] = useLazyQuery<
    CustomerImportJobResultQuery,
    CustomerImportJobResultQueryVariables
  >(GET_CUSTOMER_IMPORT_JOB_RESULT, {
    client: apolloCoreClient,
    errorPolicy: 'all',
  });
  const [startCustomerImportJobMutation, { error: startError, loading: startLoading }] =
    useMutation<
      StartCustomerImportJobMutation,
      StartCustomerImportJobMutationVariables
    >(START_CUSTOMER_IMPORT_JOB, {
      client: apolloCoreClient,
    });
  const [
    saveCustomerImportMappingMutation,
    { error: saveMappingError, loading: saveMappingLoading },
  ] = useMutation<
    SaveCustomerImportMappingMutation,
    SaveCustomerImportMappingMutationVariables
  >(SAVE_CUSTOMER_IMPORT_MAPPING, {
    client: apolloCoreClient,
  });
  const [
    commitCustomerImportJobMutation,
    { error: commitError, loading: commitLoading },
  ] = useMutation<
    CommitCustomerImportJobMutation,
    CommitCustomerImportJobMutationVariables
  >(COMMIT_CUSTOMER_IMPORT_JOB, {
    client: apolloCoreClient,
  });

  useSnackBarOnQueryError(error);
  useSnackBarOnQueryError(startError);
  useSnackBarOnQueryError(saveMappingError);
  useSnackBarOnQueryError(commitError);
  useSnackBarOnQueryError(resultError);

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

  const saveCustomerImportMapping = async (
    input: SaveCustomerImportMappingMutationVariables['input'],
  ) => {
    const result = await saveCustomerImportMappingMutation({
      variables: {
        input,
      },
    });

    await refetch({
      limit: 20,
    });

    return result.data?.saveCustomerImportMapping ?? null;
  };

  const commitCustomerImportJob = async (
    input: CommitCustomerImportJobMutationVariables['input'],
  ) => {
    const result = await commitCustomerImportJobMutation({
      variables: {
        input,
      },
    });

    await refetch({
      limit: 20,
    });
    setActiveResult(result.data?.commitCustomerImportJob ?? null);

    return result.data?.commitCustomerImportJob ?? null;
  };

  const getCustomerImportJobResult = async (
    input: CustomerImportJobResultQueryVariables,
  ) => {
    const result = await getCustomerImportJobResultQuery({
      variables: input,
    });
    const importResult = result.data?.customerImportJobResult ?? null;

    setActiveResult(importResult);

    return importResult;
  };

  return {
    activeResult,
    commitCustomerImportJob,
    commitLoading,
    getCustomerImportJobResult,
    jobs: data?.customerImportJobsOverview.jobs ?? [],
    loading,
    resultLoading,
    saveCustomerImportMapping,
    saveMappingLoading,
    startCustomerImportJob,
    startLoading,
    totalCount: data?.customerImportJobsOverview.totalCount ?? 0,
  };
};
