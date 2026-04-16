import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';

import { ActivityList } from '@/activities/components/ActivityList';
import { TaskRow } from '@/activities/tasks/components/TaskRow';
import { WorkbenchBlockCard } from '@/workbench/components/WorkbenchBlockCard';
import {
  WorkbenchBlockEmptyState,
  WorkbenchBlockHint,
} from '@/workbench/components/WorkbenchBlockText';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const TasksDueTodayBlock = () => {
  const { t } = useLingui();
  const { tasksDueToday, totalTasksDueTodayCount, loading, hasError } =
    useTasksDueToday();
  const tasksViewLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
    preferredViewName: 'Tasks Due Today',
  });

  return (
    <WorkbenchBlockCard
      testId="sales-workbench-block-tasks-due-today"
      title={t`Tasks Due Today`}
      description={t`Review the seller's tasks due today so the next actions stay visible and on time.`}
      count={totalTasksDueTodayCount}
      footerLabel={t`Open today's tasks queue`}
      footerTo={tasksViewLink}
    >
      {loading ? (
        <WorkbenchBlockEmptyState>{t`Loading today's tasks...`}</WorkbenchBlockEmptyState>
      ) : hasError ? (
        <WorkbenchBlockEmptyState>
          {t`Today's task queue is temporarily unavailable. Open the tasks list to retry.`}
        </WorkbenchBlockEmptyState>
      ) : tasksDueToday.length === 0 ? (
        <WorkbenchBlockEmptyState>
          {t`Today's task queue is clear for this seller.`}
        </WorkbenchBlockEmptyState>
      ) : (
        <>
          <WorkbenchBlockHint>
            {t`Tick a task to mark it done, or click a row to open the task details in the side panel.`}
          </WorkbenchBlockHint>
          <ActivityList>
            {tasksDueToday.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ActivityList>
        </>
      )}
    </WorkbenchBlockCard>
  );
};



