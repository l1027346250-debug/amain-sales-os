import { SyncJobErrorCategory } from 'src/modules/sync-jobs/types/sync-job.type';

export class TwentyClientRequestError extends Error {
  constructor(
    message: string,
    readonly category: SyncJobErrorCategory,
    readonly retryable: boolean,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = TwentyClientRequestError.name;
  }
}
