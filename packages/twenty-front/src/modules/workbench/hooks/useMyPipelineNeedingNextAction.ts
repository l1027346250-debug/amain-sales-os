import { useMemo } from 'react';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular, type RecordGqlOperationOrderBy } from 'twenty-shared/types';

export type WorkbenchOpportunityRecord = ObjectRecord & {
  id: string;
  name?: string | null;
  amount?: number | string | null;
  stage?: unknown;
  nextAction?: string | null;
  nextActionDate?: string | null;
  updatedAt?: string | null;
  closeDate?: string | null;
  ownerId?: string | null;
  company?: {
    id?: string | null;
    name?: string | null;
  } | null;
};

const OPPORTUNITY_ORDER_BY: RecordGqlOperationOrderBy = [
  { updatedAt: 'AscNullsLast' },
];

const CLOSED_STAGE_VALUES = new Set(['WON', 'LOST']);

const getSelectValue = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const maybeValue = (value as { value?: string | null }).value;
    const maybeLabel = (value as { label?: string | null }).label;
    const maybeName = (value as { name?: string | null }).name;

    return maybeValue ?? maybeLabel ?? maybeName ?? null;
  }

  return null;
};

const isMissingText = (value?: string | null) => !value || value.trim().length === 0;

export const useMyPipelineNeedingNextAction = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { records, loading, error } = useFindManyRecords<WorkbenchOpportunityRecord>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    limit: 100,
    orderBy: OPPORTUNITY_ORDER_BY,
    skip: !currentWorkspaceMember?.id,
  });

  const allMyPipelineNeedingNextAction = useMemo(() => {
    if (!currentWorkspaceMember?.id) {
      return [];
    }

    return records.filter((opportunity) => {
      if (opportunity.ownerId !== currentWorkspaceMember.id) {
        return false;
      }

      const stageValue = getSelectValue(opportunity.stage);

      if (stageValue && CLOSED_STAGE_VALUES.has(stageValue)) {
        return false;
      }

      return (
        isMissingText(opportunity.nextAction) ||
        isMissingText(opportunity.nextActionDate)
      );
    });
  }, [currentWorkspaceMember?.id, records]);

  return {
    myPipelineNeedingNextAction: allMyPipelineNeedingNextAction.slice(0, 5),
    totalMyPipelineNeedingNextActionCount:
      allMyPipelineNeedingNextAction.length,
    loading,
    hasError: Boolean(error),
  };
};

