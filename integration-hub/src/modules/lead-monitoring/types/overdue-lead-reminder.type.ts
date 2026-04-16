export type OverdueLeadReminder = {
  leadId: string;
  leadName: string | null;
  email: string | null;
  assignedToId: string | null;
  createdAt: string | null;
  overdueHours: number | null;
};
