export type FirstResponseTaskRequest = {
  leadId: string;
  mode: 'prepared';
  endpoint: '/rest/tasks';
  payload: {
    title: string;
    status: 'TODO';
    dueAt: string;
    assigneeId: string | null;
    result: null;
    bodyV2: {
      blocknote: string;
      markdown: string;
    };
  };
  relationGap: {
    status: 'unlinked';
    reason: 'lead-task relation is not available in current phase 1 task schema';
  };
};
