import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';

import { useSnackBarOnQueryError } from '@/apollo/hooks/useSnackBarOnQueryError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { type TradeCrmCustomerPresentationRecord } from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';

type CustomerDedupAppliedRule = {
  field: string;
  weight: number;
};

export type CustomerDedupHit = {
  customer: TradeCrmCustomerPresentationRecord;
  matchedContact: TradeCrmCustomerPresentationRecord | null;
  matchScore: number;
  matchedFields: string[];
  primaryMatch: string | null;
};

type CustomerDedupSearchQuery = {
  customerDedupSearch: {
    hits: Array<{
      customer: Record<string, unknown> & { id: string };
      matchedContact: (Record<string, unknown> & { id: string }) | null;
      matchScore: number;
      matchedFields: string[];
      primaryMatch: string | null;
    }>;
    totalCount: number;
    appliedRules: CustomerDedupAppliedRule[];
  };
};

type CustomerDedupSearchQueryVariables = {
  searchTerm?: string;
  limit?: number;
};

type MergeCustomersMutation = {
  mergeCustomers: {
    primaryCustomerId: string;
    mergedCustomerIds: string[];
    migratedContactCount: number;
    migratedOpportunityCount: number;
    migratedTimelineCount: number;
    migratedAttachmentCount: number;
    mergeLogId: string | null;
  };
};

type MergeCustomersMutationVariables = {
  input: {
    primaryCustomerId: string;
    duplicateCustomerIds: string[];
    reason?: string;
  };
};

const GET_CUSTOMER_DEDUP_SEARCH = gql`
  query GetCustomerDedupSearch($searchTerm: String, $limit: Int) {
    customerDedupSearch(searchTerm: $searchTerm, limit: $limit) {
      totalCount
      hits {
        customer
        matchedContact
        matchScore
        matchedFields
        primaryMatch
      }
      appliedRules {
        field
        weight
      }
    }
  }
`;

const MERGE_CUSTOMERS = gql`
  mutation MergeCustomers($input: MergeCustomersInput!) {
    mergeCustomers(input: $input) {
      primaryCustomerId
      mergedCustomerIds
      migratedContactCount
      migratedOpportunityCount
      migratedTimelineCount
      migratedAttachmentCount
      mergeLogId
    }
  }
`;

export const useTradeCrmCustomerDedupSearch = (searchTerm: string) => {
  const apolloCoreClient = useApolloCoreClient();
  const normalizedSearchTerm = searchTerm.trim();
  const { data, error, loading, refetch } = useQuery<
    CustomerDedupSearchQuery,
    CustomerDedupSearchQueryVariables
  >(GET_CUSTOMER_DEDUP_SEARCH, {
    client: apolloCoreClient,
    errorPolicy: 'all',
    skip: normalizedSearchTerm.length === 0,
    variables: {
      limit: 20,
      searchTerm: normalizedSearchTerm || undefined,
    },
  });
  const [mergeCustomersMutation, { error: mergeCustomersError, loading: mergeCustomersLoading }] =
    useMutation<MergeCustomersMutation, MergeCustomersMutationVariables>(
      MERGE_CUSTOMERS,
      {
        client: apolloCoreClient,
      },
    );

  useSnackBarOnQueryError(error);
  useSnackBarOnQueryError(mergeCustomersError);

  const mergeCustomers = async ({
    duplicateCustomerIds,
    primaryCustomerId,
    reason,
  }: MergeCustomersMutationVariables['input']) => {
    const result = await mergeCustomersMutation({
      variables: {
        input: {
          duplicateCustomerIds,
          primaryCustomerId,
          reason,
        },
      },
    });

    if (normalizedSearchTerm.length > 0) {
      await refetch({
        limit: 20,
        searchTerm: normalizedSearchTerm,
      });
    }

    return result.data?.mergeCustomers ?? null;
  };

  return {
    loading,
    mergeCustomers,
    mergeCustomersLoading,
    totalCount: data?.customerDedupSearch.totalCount ?? 0,
    appliedRules: data?.customerDedupSearch.appliedRules ?? [],
    hits:
      data?.customerDedupSearch.hits.map((hit) => ({
        customer: {
          ...hit.customer,
          __typename: 'Company',
        },
        matchedContact: hit.matchedContact
          ? {
              ...hit.matchedContact,
              __typename: 'Person',
            }
          : null,
        matchScore: hit.matchScore,
        matchedFields: hit.matchedFields,
        primaryMatch: hit.primaryMatch,
      })) ?? [],
  };
};
