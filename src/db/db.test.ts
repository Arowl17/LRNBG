import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BackupError,
  backupFileName,
  exportBackup,
  importBackup,
  parseBackup,
  resetAll,
} from './backup';
import { DB_SCHEMA_VERSION, ShtarkelDB } from './db';
import { defaultUserState, type CardRecord } from './records';
import { loadOrCreateUser, saveUser } from './user';

let db: ShtarkelDB;
let n = 0;

beforeEach(async () => {
  db = new ShtarkelDB(`test-${++n}`);
  await db.open();
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

const card: CardRecord = {
  id: 'lex.kafe::recognize',
  targetId: 'lex.kafe',
  direction: 'recognize',
  due: 1_700_000_000_000,
  stability: 1,
  difficulty: 5,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 0,
  lapses: 0,
  state: 0,
  createdAt: 1_700_000_000_000,
};

async function seed() {
  await loadOrCreateUser(db);
  await db.cards.put(card);
  await db.reviewLog.add({
    exerciseId: 'ex.a1-01.01',
    targets: ['lex.kafe'],
    verdict: 'correct',
    rating: 3,
    latencyMs: 1200,
    inputMode: 'tiles',
    timestamp: 1_700_000_000_000,
  });
  await db.lessonState.put({
    lessonId: 'lesson.a1-01-01',
    completed: true,
    bestAccuracy: 0.9,
    completedAt: 1,
    timesCompleted: 1,
  });
  await db.reports.add({
    exerciseId: 'ex.a1-01.01',
    category: 'other',
    text: 'hi',
    contentVersion: 'v1',
    createdAt: 1,
  });
  await db.meta.put({ key: 'contentVersion', value: 'v1' });
}

describe('database', () => {
  it('opens at the current schema version with all tables', () => {
    expect(db.verno).toBe(DB_SCHEMA_VERSION);
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ['cards', 'lessonState', 'meta', 'reports', 'reviewLog', 'userState'].sort(),
    );
  });

  it('creates the default user once and returns it afterwards', async () => {
    const first = await loadOrCreateUser(db);
    expect(first.sourceLanguage).toBe('en');
    expect(first.settings.heartsEnabled).toBe(false); // SPEC §14: hearts off by default
    await saveUser(db, { ...first, sourceLanguage: 'tr' });
    const second = await loadOrCreateUser(db);
    expect(second.sourceLanguage).toBe('tr');
    expect(await db.userState.count()).toBe(1);
  });

  it('fills in settings added after the record was saved', async () => {
    const old = defaultUserState();
    const oldSettings: Partial<typeof old.settings> = { ...old.settings };
    delete oldSettings.phoneticTyping; // as saved by Phase 0
    await db.userState.put({ ...old, settings: oldSettings } as typeof old);
    const loaded = await loadOrCreateUser(db);
    expect(loaded.settings.phoneticTyping).toBe(true);
  });

  it('refuses to save an invalid user state', async () => {
    const user = await loadOrCreateUser(db);
    await expect(saveUser(db, { ...user, xp: -5 })).rejects.toThrow();
  });

  it('indexes review logs by target', async () => {
    await seed();
    expect(await db.reviewLog.where('targets').equals('lex.kafe').count()).toBe(1);
  });
});

describe('backup', () => {
  it('round-trips: export → wipe → import restores everything', async () => {
    await seed();
    const backup = await exportBackup(db, new Date('2026-10-12T10:00:00Z'));
    expect(backup).toMatchObject({
      format: BACKUP_FORMAT,
      backupVersion: BACKUP_VERSION,
      exportedAt: '2026-10-12T10:00:00.000Z',
    });

    const text = JSON.stringify(backup);
    await resetAll(db);
    for (const table of db.tables) expect(await table.count()).toBe(0);

    await importBackup(db, parseBackup(text));
    expect(await exportBackup(db, new Date('2026-10-12T10:00:00Z'))).toEqual(backup);
  });

  it('import replaces existing data rather than merging', async () => {
    await seed();
    const backup = await exportBackup(db);
    await db.cards.put({ ...card, id: 'lex.chay::recognize', targetId: 'lex.chay' });
    await importBackup(db, backup);
    expect(await db.cards.count()).toBe(1);
  });

  it('import is all-or-nothing', async () => {
    await seed();
    const backup = await exportBackup(db);
    // A function can't be stored in IndexedDB, so the last table write fails mid-import.
    const broken = {
      ...backup,
      data: { ...backup.data, meta: [{ key: 'x', value: (() => 1) as unknown as string }] },
    };
    await expect(importBackup(db, broken)).rejects.toThrow();
    expect(await db.cards.count()).toBe(1); // untouched
  });

  it.each([
    ['invalid JSON', '{nope'],
    ['not a backup', JSON.stringify({ hello: 1 })],
    [
      'future version',
      JSON.stringify({ format: BACKUP_FORMAT, backupVersion: BACKUP_VERSION + 1 }),
    ],
    ['missing version', JSON.stringify({ format: BACKUP_FORMAT })],
    [
      'bad record',
      JSON.stringify({
        format: BACKUP_FORMAT,
        backupVersion: 1,
        dbSchemaVersion: 1,
        exportedAt: 'x',
        data: {
          cards: [{ id: 1 }],
          reviewLog: [],
          lessonState: [],
          userState: [],
          reports: [],
          meta: [],
        },
      }),
    ],
    [
      'two users',
      JSON.stringify({
        format: BACKUP_FORMAT,
        backupVersion: 1,
        dbSchemaVersion: 1,
        exportedAt: 'x',
        data: {
          cards: [],
          reviewLog: [],
          lessonState: [],
          userState: [defaultUserState(), defaultUserState()],
          reports: [],
          meta: [],
        },
      }),
    ],
  ])('rejects %s', (_label, text) => {
    expect(() => parseBackup(text)).toThrow(BackupError);
  });

  it('names files by local date', () => {
    expect(backupFileName(new Date(2026, 9, 2))).toBe('shtarkel-backup-2026-10-02.json');
  });
});
