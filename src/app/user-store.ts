import { create } from 'zustand';
import { db } from '../db/db';
import { defaultUserState, type Settings, type UserStateRecord } from '../db/records';
import { loadOrCreateUser, saveUser } from '../db/user';

interface UserStore {
  /** False until the learner's state has been read from IndexedDB. */
  ready: boolean;
  user: UserStateRecord;
  load: () => Promise<void>;
  update: (patch: Partial<Omit<UserStateRecord, 'id' | 'settings'>>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

/** In-memory copy of the learner's state. IndexedDB is the source of truth; this mirrors it. */
export const useUserStore = create<UserStore>()((set, get) => ({
  ready: false,
  user: defaultUserState(0),
  load: async () => {
    const user = await loadOrCreateUser(db);
    set({ user, ready: true });
  },
  update: async (patch) => {
    const next = { ...get().user, ...patch };
    await saveUser(db, next);
    set({ user: next });
  },
  updateSettings: async (patch) => {
    const current = get().user;
    const next = { ...current, settings: { ...current.settings, ...patch } };
    await saveUser(db, next);
    set({ user: next });
  },
}));
