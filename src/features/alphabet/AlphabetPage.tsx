import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useUserStore } from '../../app/user-store';
import { BULGARIAN_ALPHABET } from '../../content/schema';
import type { LessonStateRecord } from '../../db/records';
import { letterTarget } from '../../engine/session/alphabet';
import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';
import { LetterCard } from '../exercises/alphabet_intro';
import { lessonStates } from './progress';
import { useAlphabet } from './useAlphabet';

const linkButton =
  'inline-flex min-h-11 items-center justify-center rounded-card px-4 font-semibold';

/** Section 0 overview: the six alphabet lessons and a tappable chart of all 30 letters. */
export function AlphabetPage() {
  const t = useT();
  const state = useAlphabet();
  const user = useUserStore((s) => s.user);
  const ctx = { lang: user.sourceLanguage, settings: user.settings };
  const [progress, setProgress] = useState<Map<string, LessonStateRecord>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== 'ready') return;
    void lessonStates(state.bundle.lessons.map((l) => l.id)).then(setProgress);
  }, [state]);

  if (state.status === 'loading')
    return <Page title={t('alphabet.title')}>{t('common.loading')}</Page>;
  if (state.status === 'error')
    return (
      <Page title={t('alphabet.title')}>
        <EmptyState>{t('path.loadError')}</EmptyState>
      </Page>
    );

  const { bundle } = state;
  const anyDone = [...progress.values()].some((p) => p.completed);
  const selectedLetter = bundle.letters.find((l) => l.lower === selected);
  const words = new Map(bundle.words.map((w) => [w.id, w]));
  // Lessons teach letters by difficulty; the chart shows them in alphabetical order.
  const alphabetical = [...bundle.letters].sort(
    (a, b) => BULGARIAN_ALPHABET.indexOf(a.lower) - BULGARIAN_ALPHABET.indexOf(b.lower),
  );

  return (
    <Page title={t('alphabet.title')}>
      <p className="mb-6 text-fg-muted">{t('alphabet.intro')}</p>

      <h2 className="mb-3 text-xl font-bold">{t('alphabet.lessons')}</h2>
      <ol className="mb-4 flex flex-col gap-3">
        {bundle.lessons.map((lesson, i) => {
          const done = progress.get(lesson.id)?.completed;
          return (
            <li
              key={lesson.id}
              className="flex items-center gap-3 rounded-card border border-border bg-surface p-3"
            >
              <div className="flex-1">
                <p className="text-sm text-fg-muted">
                  {t('alphabet.lesson', { n: i + 1 })}
                  {done && (
                    <span className="ml-2 font-semibold text-success">
                      ✓ {t('alphabet.lesson.done')}
                    </span>
                  )}
                </p>
                <h3 className="font-bold">{lesson.title[ctx.lang]}</h3>
                <p lang="bg" className="text-lg tracking-wider">
                  {lesson.newLetters.join(' ')}
                </p>
              </div>
              <Link
                to={`/alphabet/${lesson.id}`}
                className={`${linkButton} ${done ? 'border border-border bg-surface text-fg hover:bg-surface-2' : 'bg-primary text-on-primary hover:bg-primary-hover'}`}
              >
                {done ? t('alphabet.lesson.redo') : t('alphabet.lesson.start')}
              </Link>
            </li>
          );
        })}
      </ol>
      {anyDone && (
        <Link
          to="/alphabet/practice"
          className={`${linkButton} mb-8 w-full bg-accent text-on-accent`}
        >
          {t('alphabet.practiceAll')}
        </Link>
      )}

      <h2 className="mt-6 mb-1 text-xl font-bold">{t('alphabet.letters')}</h2>
      <p className="mb-3 text-sm text-fg-muted">{t('alphabet.letters.help')}</p>
      {selectedLetter && (
        <div className="mb-4 rounded-card border border-border bg-surface-2 p-4">
          <LetterCard
            exercise={{
              type: 'alphabet_intro',
              id: 'chart',
              targets: [letterTarget(selectedLetter.lower)],
              letter: selectedLetter,
              example: words.get(selectedLetter.exampleLexemeId)!,
            }}
            ctx={ctx}
          />
        </div>
      )}
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {alphabetical.map((letter) => (
          <button
            key={letter.lower}
            type="button"
            lang="bg"
            aria-label={t('alphabet.letter.label', { letter: letter.upper })}
            aria-pressed={selected === letter.lower}
            onClick={() => setSelected(selected === letter.lower ? null : letter.lower)}
            className={`flex aspect-square min-h-11 flex-col items-center justify-center rounded-card border text-xl font-bold ${
              selected === letter.lower
                ? 'border-primary bg-surface-2'
                : 'border-border bg-surface hover:bg-surface-2'
            }`}
          >
            {letter.upper}
            <span className="text-xs font-normal text-fg-muted">{letter.sound}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}
