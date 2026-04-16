import * as fs from 'node:fs';
import * as path from 'node:path';

import { StateRepository } from 'src/common/state/state.repository';

export class JsonFileStateRepository<T extends { id: string }>
  implements StateRepository<T>
{
  private static readonly RENAME_RETRY_CODES = new Set([
    'EPERM',
    'EBUSY',
    'ENOTEMPTY',
  ]);
  private static readonly RENAME_RETRY_DELAYS_MS = [25, 50, 100, 200, 400];

  constructor(private readonly filePath: string) {}

  async load(): Promise<T[]> {
    this.ensureParentDirectory();

    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    const content = fs.readFileSync(this.filePath, 'utf8').trim();

    if (content.length === 0) {
      return [];
    }

    const parsed = JSON.parse(content);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  }

  async save(records: T[]) {
    this.ensureParentDirectory();

    const tempFilePath = `${this.filePath}.tmp`;

    fs.writeFileSync(tempFilePath, JSON.stringify(records, null, 2));

    let lastError: unknown;

    for (const delayMs of JsonFileStateRepository.RENAME_RETRY_DELAYS_MS) {
      try {
        fs.rmSync(this.filePath, { force: true });
        fs.renameSync(tempFilePath, this.filePath);

        return;
      } catch (error) {
        lastError = error;

        if (
          !(
            error instanceof Error &&
            'code' in error &&
            JsonFileStateRepository.RENAME_RETRY_CODES.has(
              String(error.code),
            )
          )
        ) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  private ensureParentDirectory() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
  }
}
