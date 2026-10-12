import type { ShtarkelDB } from './db';
import { defaultUserState, userStateRecordSchema, type UserStateRecord } from './records';

/** Read the learner's state, creating the default one on first launch. */
export async function loadOrCreateUser(db: ShtarkelDB): Promise<UserStateRecord> {
  return db.transaction('rw', db.userState, async () => {
    const existing = await db.userState.get('me');
    if (existing) return existing;
    const fresh = defaultUserState();
    await db.userState.put(fresh);
    return fresh;
  });
}

/** Validate and persist the learner's state. Throws if `next` is malformed. */
export async function saveUser(db: ShtarkelDB, next: UserStateRecord): Promise<void> {
  await db.userState.put(userStateRecordSchema.parse(next));
}
