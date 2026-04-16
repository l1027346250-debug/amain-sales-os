export interface StateRepository<T extends { id: string }> {
  load(): Promise<T[]>;
  save(records: T[]): Promise<void>;
}
