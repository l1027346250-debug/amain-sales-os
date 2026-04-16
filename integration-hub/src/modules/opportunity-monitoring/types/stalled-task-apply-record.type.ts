export type StalledTaskApplyRecord = {
  id: string;
  opportunityId: string;
  endpoint: '/rest/tasks';
  mode: 'remote';
  recordId: string | null;
  applyRequested: true;
  appliedAt: string;
  relationGap: {
    status: 'unlinked';
    reason: 'opportunity-task relation is not available in current phase 1 task schema';
  };
};
