import Dexie, { type EntityTable } from 'dexie';
import type {
  CardRecord,
  LessonStateRecord,
  MetaRecord,
  ReportRecord,
  ReviewLogRecord,
  UserStateRecord,
} from './records';

export const DB_NAME = 'shtarkel';

/**
 * Current database schema version. To change the schema:
 *  1. add a new `this.version(N + 1).stores({...}).upgrade(...)` block below (never edit old ones),
 *  2. bump DB_SCHEMA_VERSION,
 *  3. add a backup upgrader in backup.ts if the record shapes changed,
 *  4. add a test in db.test.ts that opens an old-version DB and checks the upgrade.
 */
export const DB_SCHEMA_VERSION = 1;

export class ShtarkelDB extends Dexie {
  cards!: EntityTable<CardRecord, 'id'>;
  reviewLog!: EntityTable<ReviewLogRecord, 'id'>;
  lessonState!: EntityTable<LessonStateRecord, 'lessonId'>;
  userState!: EntityTable<UserStateRecord, 'id'>;
  reports!: EntityTable<ReportRecord, 'id'>;
  meta!: EntityTable<MetaRecord, 'key'>;

  constructor(name: string = DB_NAME) {
    super(name);

    // Version 1 — initial schema. Only indexed fields are listed; other fields are stored as-is.
    this.version(1).stores({
      cards: 'id, targetId, due, state',
      reviewLog: '++id, exerciseId, *targets, timestamp',
      lessonState: 'lessonId',
      userState: 'id',
      reports: '++id, exerciseId, createdAt',
      meta: 'key',
    });
  }
}

export const db = new ShtarkelDB();

/** The tables included in backups, in a fixed order. */
export const BACKUP_TABLES = [
  'cards',
  'reviewLog',
  'lessonState',
  'userState',
  'reports',
  'meta',
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];
