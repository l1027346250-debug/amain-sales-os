export type FirstResponseTaskApplyRecord = {
  id: string;
  leadId: string;
  endpoint: '/rest/tasks';
  mode: 'remote';
  recordId: string | null;
  applyRequested: true;
  appliedAt: string;
  relationGap: {
    status: 'unlinked';
    reason: 'lead-task relation is not available in current phase 1 task schema';
  };
};
