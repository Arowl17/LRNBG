import { describe, expect, it } from 'vitest';
import { en } from './en';
import { messages, translate } from './index';
import { tr } from './tr';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('i18n dictionaries', () => {
  it('EN and TR have exactly the same keys', () => {
    expect(Object.keys(tr).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.keys(en) as (keyof typeof en)[])(
    '%s is non-empty with matching placeholders',
    (key) => {
      for (const dict of Object.values(messages)) {
        expect(dict[key].trim()).not.toBe('');
        expect(placeholders(dict[key])).toEqual(placeholders(en[key]));
      }
    },
  );
});

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'path.unitCount', { count: 3 })).toBe('3 units');
    expect(translate('tr', 'path.unitCount', { count: 3 })).toBe('3 ünite');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'settings.export.success', {})).toBe('Backup saved as {file}.');
  });

  it('returns the template when no params are given', () => {
    expect(translate('en', 'nav.path')).toBe('Learn');
  });
});
