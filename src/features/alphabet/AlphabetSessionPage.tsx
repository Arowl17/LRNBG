import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useUserStore } from '../../app/user-store';
import type { AlphabetBundle } from '../../content/schema';
import { buildAlphabetLesson, buildAlphabetPractice } from '../../engine/session/alphabet';
import { seededRng } from '../../lib/random';
import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';
import type { ExerciseContext } from '../exercises/types';
import { ExerciseSession, type SessionSummary } from '../lesson/ExerciseSession';
import { LessonComplete } from '../lesson/LessonComplete';
import { completeLesson, lessonStates, logAnswer } from '../lesson/progress';
import { useAlphabet } from './useAlphabet';

function Session({
  bundle,
  lessonId,
  ctx,
}: {
  bundle: AlphabetBundle;
  lessonId: string;
  ctx: ExerciseContext;
}) {
  const t = useT();
  const navigate = useNavigate();
  const [round, setRound] = useState(0);
  const [seed] = useState(() => Date.now()); // new exercise order each visit
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [practiceLessons, setPracticeLessons] = useState<string[] | null>(null);
  const isPractice = lessonId === 'practice';
  const lesson = bundle.lessons.find((l) => l.id === lessonId);

  // Practice covers completed lessons (or lesson 1 if none are done yet).
  useEffect(() => {
    if (!isPractice) return;
    let cancelled = false;
    void lessonStates(bundle.lessons.map((l) => l.id)).then((states) => {
      const done = bundle.lessons.filter((l) => states.get(l.id)?.completed).map((l) => l.id);
      if (!cancelled) setPracticeLessons(done.length ? done : [bundle.lessons[0]!.id]);
    });
    return () => {
      cancelled = true;
    };
  }, [bundle, isPractice]);

  const exercises = useMemo(() => {
    const rng = seededRng(seed + round);
    if (isPractice)
      return practiceLessons ? buildAlphabetPractice(bundle, practiceLessons, { rng }) : [];
    return lesson ? buildAlphabetLesson(bundle, lesson.id, { rng }) : [];
  }, [bundle, isPractice, lesson, practiceLessons, round, seed]);

  if (summary) {
    return (
      <LessonComplete
        summary={summary}
        learned={lesson?.newLetters ?? []}
        learnedLabel={t('complete.letters')}
        backTo="/alphabet"
        backLabel={t('complete.back')}
        onAgain={() => {
          setSummary(null);
          setRound((r) => r + 1);
        }}
      />
    );
  }
  if (exercises.length === 0) return null;

  return (
    <ExerciseSession
      key={round}
      exercises={exercises}
      ctx={ctx}
      contentVersion={bundle.contentVersion}
      onAnswer={(record) => void logAnswer(record)}
      onFinish={(s) => {
        if (lesson) void completeLesson(lesson.id, s.accuracy);
        setSummary(s);
      }}
      onQuit={() => void navigate('/alphabet')}
    />
  );
}

/** /alphabet/:lessonId — one alphabet lesson, or /alphabet/practice for mixed review. */
export function AlphabetSessionPage() {
  const t = useT();
  const { lessonId = '' } = useParams();
  const state = useAlphabet();
  const user = useUserStore((s) => s.user);
  const ctx = useMemo(
    () => ({ lang: user.sourceLanguage, settings: user.settings }),
    [user.sourceLanguage, user.settings],
  );

  if (state.status === 'loading')
    return <Page title={t('alphabet.title')}>{t('common.loading')}</Page>;
  if (state.status === 'error')
    return (
      <Page title={t('alphabet.title')}>
        <EmptyState>{t('path.loadError')}</EmptyState>
      </Page>
    );
  if (lessonId !== 'practice' && !state.bundle.lessons.some((l) => l.id === lessonId)) {
    return (
      <Page title={t('alphabet.title')}>
        <EmptyState>{t('alphabet.notFound')}</EmptyState>
        <Link to="/alphabet" className="mt-4 inline-block font-semibold text-primary underline">
          {t('common.back')}
        </Link>
      </Page>
    );
  }
  return <Session key={lessonId} bundle={state.bundle} lessonId={lessonId} ctx={ctx} />;
}
