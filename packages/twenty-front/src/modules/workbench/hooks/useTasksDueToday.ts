import { useMemo } from 'react';
import { isToday } from 'date-fns';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { type Task } from '@/activities/types/Task';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { parseDate } from '~/utils/date-utils';
import { CoreObjectNameSingular, type RecordGqlOperationOrderBy } from 'twenty-shared/types';

const TASK_ORDER_BY: RecordGqlOperationOrderBy = [{ dueAt: 'AscNullsLast' }];

export const useTasksDueToday = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { records, loading, error } = useFindManyRecords<Task>({
    objectNameSingular: CoreObjectNameSingular.Task,
    limit: 100,
    orderBy: TASK_ORDER_BY,
    skip: !currentWorkspaceMember?.id,
  });

  const allTasksDueToday = useMemo(() => {
    if (!currentWorkspaceMember?.id) {
      return [];
    }

    return records.filter((task) => {
      if (!task.dueAt || task.status === 'DONE') {
        return false;
      }

      if (task.assigneeId !== currentWorkspaceMember.id) {
        return false;
      }

      try {
        return isToday(parseDate(task.dueAt));
      } catch {
        return false;
      }
    });
  }, [currentWorkspaceMember?.id, records]);

  return {
    tasksDueToday: allTasksDueToday.slice(0, 5),
    totalTasksDueTodayCount: allTasksDueToday.length,
    loading,
    hasError: Boolean(error),
  };
};
