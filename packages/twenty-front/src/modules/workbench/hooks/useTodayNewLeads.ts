import { useMemo } from 'react';
import { isToday } from 'date-fns';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { parseDate } from '~/utils/date-utils';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationOrderBy,
} from 'twenty-shared/types';

export type WorkbenchLeadRecord = ObjectRecord & {
  id: string;
  createdAt: string;
  leadName?: string | null;
  contactName?: string | null;
  email?: string | null;
  companyName?: string | null;
  source?: unknown;
  productCategory?: unknown;
  country?: unknown;
};

const LEAD_ORDER_BY: RecordGqlOperationOrderBy = [{ createdAt: 'DescNullsLast' }];

export const useTodayNewLeads = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasLeadObject = objectMetadataItems.some(
    (item) => item.nameSingular === 'lead',
  );

  const { records, loading, error } = useFindManyRecords<WorkbenchLeadRecord>({
    objectNameSingular: hasLeadObject
      ? 'lead'
      : CoreObjectNameSingular.Company,
    limit: 50,
    orderBy: LEAD_ORDER_BY,
    skip: !hasLeadObject || !currentWorkspaceMember?.id,
  });

  const allTodayNewLeads = useMemo(
    () =>
      records.filter((record) => {
        if (!record.createdAt) {
          return false;
        }

        try {
          return isToday(parseDate(record.createdAt));
        } catch {
          return false;
        }
      }),
    [records],
  );

  return {
    todayNewLeads: allTodayNewLeads.slice(0, 5),
    totalTodayNewLeadsCount: allTodayNewLeads.length,
    loading,
    hasError: Boolean(error),
  };
};
