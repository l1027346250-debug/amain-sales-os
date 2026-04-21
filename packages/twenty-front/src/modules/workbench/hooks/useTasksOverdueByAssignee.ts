import { useMemo } from 'react';
import { isBefore, startOfToday } from 'date-fns';

import { type Task } from '@/activities/types/Task';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { parseDate } from '~/utils/date-utils';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationOrderBy,
} from 'twenty-shared/types';

const TASK_ORDER_BY: RecordGqlOperationOrderBy = [{ dueAt: 'AscNullsLast' }];

export const useTasksOverdueByAssignee = () => {
  const { records, loading, error } = useFindManyRecords<Task>({
    objectNameSingular: CoreObjectNameSingular.Task,
    limit: 100,
    orderBy: TASK_ORDER_BY,
  });

  const overdueTasks = useMemo(() => {
    const todayStart = startOfToday();

    return records.filter((task) => {
      if (!task.dueAt || task.status === 'DONE') {
        return false;
      }

      try {
        return isBefore(parseDate(task.dueAt), todayStart);
      } catch {
        return false;
      }
    });
  }, [records]);

  const ownerPreview = useMemo(() => {
    const ownerCountMap = new Map<string, number>();

    for (const task of overdueTasks) {
      const ownerLabel =
        getAssigneeLabel(task) ?? task.assigneeId?.trim() ?? 'Unassigned';

      ownerCountMap.set(ownerLabel, (ownerCountMap.get(ownerLabel) ?? 0) + 1);
    }

    return Array.from(ownerCountMap.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([ownerLabel, count]) => `${ownerLabel} (${count})`);
  }, [overdueTasks]);

  return {
    overdueTasks: overdueTasks.slice(0, 5),
    totalOverdueTasksCount: overdueTasks.length,
    affectedAssigneeCount: new Set(
      overdueTasks.map(
        (task) => task.assigneeId?.trim() ?? getAssigneeLabel(task) ?? 'unassigned',
      ),
    ).size,
    ownerPreview,
    loading,
    hasError: Boolean(error),
  };
};

const getAssigneeLabel = (task: Task) => {
  const firstName = task.assignee?.name?.firstName?.trim() ?? '';
  const lastName = task.assignee?.name?.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? fullName : null;
};
