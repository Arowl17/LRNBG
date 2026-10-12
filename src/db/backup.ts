import { z } from 'zod';
import { BACKUP_TABLES, DB_SCHEMA_VERSION, type ShtarkelDB } from './db';
import {
  cardRecordSchema,
  lessonStateRecordSchema,
  metaRecordSchema,
  reportRecordSchema,
  reviewLogRecordSchema,
  userStateRecordSchema,
} from './records';

export const BACKUP_FORMAT = 'shtarkel-backup';

/** Version of the backup file layout. Bump together with an entry in BACKUP_UPGRADERS. */
export const BACKUP_VERSION = 1;

const backupDataSchema = z.object({
  cards: z.array(cardRecordSchema),
  reviewLog: z.array(reviewLogRecordSchema),
  lessonState: z.array(lessonStateRecordSchema),
  userState: z.array(userStateRecordSchema).max(1),
  reports: z.array(reportRecordSchema),
  meta: z.array(metaRecordSchema),
});

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  backupVersion: z.literal(BACKUP_VERSION),
  dbSchemaVersion: z.number().int(),
  exportedAt: z.string(),
  data: backupDataSchema,
});
export type Backup = z.infer<typeof backupSchema>;

/**
 * Upgraders turn an older backup into the next version: BACKUP_UPGRADERS[n] converts
 * version n → n + 1. Empty while we are on version 1.
 */
const BACKUP_UPGRADERS: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> =
  {};

export class BackupError extends Error {
  override name = 'BackupError';
}

/** Parse untrusted JSON text into a validated, up-to-date backup. Throws BackupError. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('File is not valid JSON.');
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('format' in raw) ||
    raw.format !== BACKUP_FORMAT
  ) {
    throw new BackupError('File is not a Shtarkel backup.');
  }
  let current = raw as Record<string, unknown>;
  let version = typeof current.backupVersion === 'number' ? current.backupVersion : NaN;
  if (!Number.isInteger(version) || version < 1 || version > BACKUP_VERSION) {
    throw new BackupError(`Unsupported backup version: ${String(current.backupVersion)}.`);
  }
  while (version < BACKUP_VERSION) {
    const upgrade = BACKUP_UPGRADERS[version];
    if (!upgrade) throw new BackupError(`No upgrade path from backup version ${version}.`);
    current = upgrade(current);
    version += 1;
  }
  const result = backupSchema.safeParse(current);
  if (!result.success) {
    throw new BackupError(`Backup failed validation: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export async function exportBackup(db: ShtarkelDB, now: Date = new Date()): Promise<Backup> {
  return db.transaction(
    'r',
    BACKUP_TABLES.map((t) => db.table(t)),
    async () => ({
      format: BACKUP_FORMAT,
      backupVersion: BACKUP_VERSION,
      dbSchemaVersion: DB_SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      data: {
        cards: await db.cards.toArray(),
        reviewLog: await db.reviewLog.toArray(),
        lessonState: await db.lessonState.toArray(),
        userState: await db.userState.toArray(),
        reports: await db.reports.toArray(),
        meta: await db.meta.toArray(),
      },
    }),
  );
}

/** Replace everything on this device with the backup, atomically (all or nothing). */
export async function importBackup(db: ShtarkelDB, backup: Backup): Promise<void> {
  await db.transaction(
    'rw',
    BACKUP_TABLES.map((t) => db.table(t)),
    async () => {
      for (const table of BACKUP_TABLES) {
        await db.table(table).clear();
        await db.table(table).bulkPut(backup.data[table]);
      }
    },
  );
}

/** Delete all progress on this device. */
export async function resetAll(db: ShtarkelDB): Promise<void> {
  await db.transaction(
    'rw',
    BACKUP_TABLES.map((t) => db.table(t)),
    async () => {
      for (const table of BACKUP_TABLES) await db.table(table).clear();
    },
  );
}

export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `shtarkel-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
