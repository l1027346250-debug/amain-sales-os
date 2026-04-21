export type EnterpriseSalesPlaybookStageInput = {
  id?: string;
  stageName?: string;
  stageCode?: string;
  sortOrder?: number;
  enabled?: boolean;
};

export class ReplaceEnterpriseSalesPlaybookStagesDto {
  stages?: EnterpriseSalesPlaybookStageInput[];
}
