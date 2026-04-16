import { Pool } from 'pg';

import { StateRepository } from 'src/common/state/state.repository';

export class PostgresStateRepository<T extends { id: string }>
  implements StateRepository<T>
{
  private initialized = false;

  constructor(
    private readonly pool: Pool,
    private readonly tableName: string,
  ) {}

  async load(): Promise<T[]> {
    await this.ensureInitialized();

    const result = await this.pool.query<{
      record: T;
    }>(
      `SELECT record
       FROM ${this.tableName}
       ORDER BY updated_at DESC`,
    );

    return result.rows.map((row) => row.record);
  }

  async save(records: T[]): Promise<void> {
    await this.ensureInitialized();

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const ids = records.map((record) => record.id);

      if (ids.length === 0) {
        await client.query(`DELETE FROM ${this.tableName}`);
      } else {
        await client.query(
          `DELETE FROM ${this.tableName}
           WHERE id <> ALL($1::text[])`,
          [ids],
        );
      }

      for (const record of records) {
        await client.query(
          `INSERT INTO ${this.tableName} (id, record, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (id)
           DO UPDATE SET
             record = EXCLUDED.record,
             updated_at = NOW()`,
          [record.id, JSON.stringify(record)],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureInitialized() {
    if (this.initialized) {
      return;
    }

    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        record JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );

    this.initialized = true;
  }
}
