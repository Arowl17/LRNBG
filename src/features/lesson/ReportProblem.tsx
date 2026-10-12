import { useId, useState } from 'react';
import { db } from '../../db/db';
import type { ReportRecord } from '../../db/records';
import { useT, type MessageKey } from '../../i18n';
import { Button } from '../../ui/Button';

const CATEGORIES: { value: ReportRecord['category']; label: MessageKey }[] = [
  { value: 'answer_should_be_accepted', label: 'report.accepted' },
  { value: 'translation_wrong', label: 'report.translation' },
  { value: 'audio_wrong', label: 'report.audio' },
  { value: 'other', label: 'report.other' },
];

interface Props {
  exerciseId: string;
  /** What the learner answered, if anything (helps grow the accepted-answers lists). */
  userAnswer?: string | undefined;
  contentVersion: string;
}

/**
 * "Report a problem" (SPEC §16.6). Reports are stored on this device and included in backups;
 * sending them to a server comes with accounts in Phase 7.
 */
export function ReportProblem({ exerciseId, userAnswer, contentVersion }: Props) {
  const t = useT();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportRecord['category']>('other');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <p className="text-center text-sm text-success" role="status">
        {t('report.thanks')}
      </p>
    );
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // After a typed answer, most reports are "my answer should be accepted".
          setCategory(userAnswer ? 'answer_should_be_accepted' : 'translation_wrong');
          setOpen(true);
        }}
        className="self-center text-sm text-fg-muted underline hover:text-fg"
      >
        {t('report.open')}
      </button>
    );
  }

  async function submit() {
    await db.reports.add({
      exerciseId,
      category,
      ...(userAnswer ? { userAnswer } : {}),
      text: text.trim(),
      contentVersion,
      createdAt: Date.now(),
    });
    setSent(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-semibold">{t('report.title')}</legend>
        {CATEGORIES.map((c) => (
          <label key={c.value} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name={`${id}-category`}
              checked={category === c.value}
              onChange={() => setCategory(c.value)}
              className="size-5 accent-primary"
            />
            {t(c.label)}
          </label>
        ))}
      </fieldset>
      <label htmlFor={`${id}-text`} className="font-semibold">
        {t('report.details')}
      </label>
      <textarea
        id={`${id}-text`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="rounded-card border border-border bg-bg p-2"
      />
      <div className="flex gap-2">
        <Button type="submit">{t('report.send')}</Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('common.close')}
        </Button>
      </div>
    </form>
  );
}
