import type { CheckResult, DiffToken, Note } from '../../engine/answer-check';
import { useT, type MessageKey } from '../../i18n';

const NOTE_KEYS: Record<Note['code'], MessageKey> = {
  accent_grave_i: 'note.accent_grave_i',
  homoglyphs_fixed: 'note.homoglyphs_fixed',
  latin_input: 'note.latin_input',
  transliteration_accepted: 'note.transliteration_accepted',
  typo: 'note.typo',
  grammar_token: 'note.grammar_token',
};

export function NoteText({ note }: { note: Note }) {
  const t = useT();
  return (
    <>{t(NOTE_KEYS[note.code], { expected: note.expected ?? '', actual: note.actual ?? '' })}</>
  );
}

/** The learner's answer, word by word: wrong words struck through, missing words shown. */
function Diff({ diff }: { diff: DiffToken[] }) {
  return (
    <p lang="bg" className="flex flex-wrap gap-x-1.5 text-lg">
      {diff.map((d, i) => {
        if (d.kind === 'equal') return <span key={i}>{d.actual}</span>;
        if (d.kind === 'missing')
          return (
            <ins key={i} className="font-bold text-success no-underline">
              {d.expected}
            </ins>
          );
        if (d.kind === 'extra')
          return (
            <del key={i} className="text-danger">
              {d.actual}
            </del>
          );
        if (d.kind === 'wrong') {
          return (
            <span key={i}>
              <del className="text-danger">{d.actual}</del>{' '}
              <ins className="font-bold text-success no-underline">{d.expected}</ins>
            </span>
          );
        }
        return (
          <mark key={i} className="rounded bg-surface-2 px-0.5 text-fg">
            {d.actual}
          </mark>
        );
      })}
    </p>
  );
}

/** Feedback after "Check" (SPEC §9.7): verdict, the right answer, highlighted mistakes, notes. */
export function Feedback({ result }: { result: CheckResult }) {
  const t = useT();
  const correct = result.verdict !== 'incorrect';
  const title = !correct
    ? t('feedback.incorrect')
    : result.verdict === 'correct_with_typo'
      ? t('feedback.typo')
      : t('feedback.correct');
  const showDiff = result.diff.some((d) => d.kind !== 'equal');
  return (
    <div
      role="status"
      className={`rounded-card border-2 p-4 ${correct ? 'border-success bg-success-bg' : 'border-danger bg-danger-bg'}`}
    >
      <p className={`text-xl font-bold ${correct ? 'text-success' : 'text-danger'}`}>{title}</p>
      {!correct && result.closest && (
        <p className="mt-1">
          {t('feedback.answer')}{' '}
          <strong lang="bg" className="text-lg">
            {result.closest}
          </strong>
        </p>
      )}
      {showDiff && !correct && <Diff diff={result.diff} />}
      {result.notes.map((note, i) => (
        <p key={i} className="mt-1 text-sm">
          <NoteText note={note} />
        </p>
      ))}
      {!correct && <p className="mt-1 text-sm text-fg-muted">{t('feedback.retryLater')}</p>}
    </div>
  );
}
