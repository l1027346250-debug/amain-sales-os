export type StalledTaskCandidate = {
  opportunityId: string;
  assignedToId: string | null;
  taskPayload: {
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
};
