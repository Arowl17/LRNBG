import { useCallback } from 'react';
import { useUserStore } from '../app/user-store';
import { en, type MessageKey } from './en';
import { tr } from './tr';

export type UiLanguage = 'en' | 'tr';
export type { MessageKey };

export const messages: Record<UiLanguage, Record<MessageKey, string>> = { en, tr };

export type MessageParams = Record<string, string | number>;

/** Look up a UI string and fill in `{placeholder}` values. Pure, so it is easy to test. */
export function translate(lang: UiLanguage, key: MessageKey, params?: MessageParams): string {
  const template = messages[lang][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** React hook: returns `t(key, params)` bound to the learner's chosen language. */
export function useT() {
  const lang = useUserStore((s) => s.user.sourceLanguage);
  return useCallback(
    (key: MessageKey, params?: MessageParams) => translate(lang, key, params),
    [lang],
  );
}
