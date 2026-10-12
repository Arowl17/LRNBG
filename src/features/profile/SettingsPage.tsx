import { useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useUserStore } from '../../app/user-store';
import { backupFileName, exportBackup, importBackup, parseBackup, resetAll } from '../../db/backup';
import { db } from '../../db/db';
import { dailyGoalXpSchema, type Settings, type UserStateRecord } from '../../db/records';
import { useT, type MessageKey } from '../../i18n';
import { Button } from '../../ui/Button';
import { Page } from '../../ui/Page';

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children(id)}
      {help && <p className="text-sm text-fg-muted">{help}</p>}
    </div>
  );
}

function Select<V extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as V)}
      className="min-h-11 rounded-card border border-border bg-surface px-3"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center justify-between gap-4">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-6 accent-primary"
        />
      </div>
      {help && <p className="text-sm text-fg-muted">{help}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const t = useT();
  const user = useUserStore((s) => s.user);
  const update = useUserStore((s) => s.update);
  const updateSettings = useUserStore((s) => s.updateSettings);
  const reload = useUserStore((s) => s.load);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      void updateSettings({ [key]: value });
  const opt = <V extends string>(value: V, label: MessageKey) => ({ value, label: t(label) });

  async function handleExport() {
    const backup = await exportBackup(db);
    const fileName = backupFileName();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: t('settings.export.success', { file: fileName }) });
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      if (!window.confirm(t('settings.import.confirm'))) return;
      await importBackup(db, backup);
      await reload();
      setMessage({ text: t('settings.import.success') });
    } catch {
      setMessage({ text: t('settings.import.error'), error: true });
    }
  }

  async function handleReset() {
    if (!window.confirm(t('settings.reset.confirm'))) return;
    await resetAll(db);
    await reload();
    setMessage({ text: t('settings.reset.success') });
  }

  return (
    <Page title={t('settings.title')}>
      <Section title={t('settings.section.general')}>
        <Field label={t('settings.language')} help={t('settings.language.help')}>
          {(id) => (
            <Select<UserStateRecord['sourceLanguage']>
              id={id}
              value={user.sourceLanguage}
              options={[opt('en', 'settings.language.en'), opt('tr', 'settings.language.tr')]}
              onChange={(sourceLanguage) => void update({ sourceLanguage })}
            />
          )}
        </Field>
        <Field label={t('settings.dailyGoal')}>
          {(id) => (
            <Select<'10' | '20' | '50'>
              id={id}
              value={String(user.dailyGoalXp) as '10' | '20' | '50'}
              options={[
                opt('10', 'settings.dailyGoal.casual'),
                opt('20', 'settings.dailyGoal.regular'),
                opt('50', 'settings.dailyGoal.serious'),
              ]}
              onChange={(v) => void update({ dailyGoalXp: dailyGoalXpSchema.parse(Number(v)) })}
            />
          )}
        </Field>
        <Toggle
          label={t('settings.hearts')}
          help={t('settings.hearts.help')}
          checked={user.settings.heartsEnabled}
          onChange={set('heartsEnabled')}
        />
      </Section>

      <Section title={t('settings.section.display')}>
        <Field label={t('settings.theme')}>
          {(id) => (
            <Select<Settings['theme']>
              id={id}
              value={user.settings.theme}
              options={[
                opt('system', 'settings.theme.system'),
                opt('light', 'settings.theme.light'),
                opt('dark', 'settings.theme.dark'),
              ]}
              onChange={set('theme')}
            />
          )}
        </Field>
        <Field label={t('settings.stress')}>
          {(id) => (
            <Select<Settings['stressDisplay']>
              id={id}
              value={user.settings.stressDisplay}
              options={[
                opt('always', 'settings.stress.always'),
                opt('new', 'settings.stress.new'),
                opt('never', 'settings.stress.never'),
              ]}
              onChange={set('stressDisplay')}
            />
          )}
        </Field>
        <Toggle
          label={t('settings.sounds')}
          checked={user.settings.soundEffects}
          onChange={set('soundEffects')}
        />
        <Toggle
          label={t('settings.haptics')}
          checked={user.settings.haptics}
          onChange={set('haptics')}
        />
      </Section>

      <Section title={t('settings.data')}>
        <p className="text-sm text-fg-muted">{t('settings.data.help')}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void handleExport()}>{t('settings.export')}</Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            {t('settings.import')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label={t('settings.import')}
            data-testid="import-input"
            onChange={(e) => void handleImport(e)}
          />
          <Button variant="danger" onClick={() => void handleReset()}>
            {t('settings.reset')}
          </Button>
        </div>
        <p role="status" className={message?.error ? 'text-danger' : 'text-success'}>
          {message?.text}
        </p>
      </Section>
    </Page>
  );
}
