export type EnterpriseSalesPlaybookItemInput = {
  id?: string;
  itemType?: string;
  title?: string;
  content?: string | null;
  attachmentIds?: string[];
  suggestionJson?: Record<string, unknown> | null;
  sortOrder?: number;
  enabled?: boolean;
};

export class ReplaceEnterpriseSalesPlaybookItemsDto {
  items?: EnterpriseSalesPlaybookItemInput[];
}
