import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useUserStore } from '../../app/user-store';
import { courseManifest, loadUnit } from '../../content/loader';
import type { UnitBundle } from '../../content/schema';
import { stripStress } from '../../content/stress';
import { composeLesson, listeningText } from '../../engine/session/lesson';
import { useT } from '../../i18n';
import { useAudio } from '../../lib/audio';
import { EmptyState, Page } from '../../ui/Page';
import { ExerciseSession, type SessionSummary } from './ExerciseSession';
import { LessonComplete } from './LessonComplete';
import { completeLesson, logAnswer } from './progress';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; bundle: UnitBundle };

/** /lesson/:lessonId — one course lesson in the session player. */
export function LessonPage() {
  const t = useT();
  const navigate = useNavigate();
  const { lessonId = '' } = useParams();
  const user = useUserStore((s) => s.user);
  const ctx = useMemo(
    () => ({ lang: user.sourceLanguage, settings: user.settings }),
    [user.sourceLanguage, user.settings],
  );
  const audio = useAudio();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [round, setRound] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<State> {
      const manifest = await courseManifest();
      const unit = manifest.units.find((u) => u.lessonIds.includes(lessonId));
      if (!unit) return { status: 'missing' };
      return { status: 'ready', bundle: await loadUnit(unit.id) };
    }
    load()
      .then((s) => !cancelled && setState(s))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const items = useMemo(() => {
    if (state.status !== 'ready' || !audio.ready) return [];
    // Listening exercises need some audio source (file or device voice); skip them otherwise.
    return composeLesson(state.bundle, lessonId, {
      include: (e) => {
        const text = listeningText(e);
        return text === undefined || audio.canPlay(text);
      },
    });
    // `round` restarts the lesson with fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, lessonId, audio.ready, round]);

  if (state.status === 'loading' || (state.status === 'ready' && !audio.ready)) {
    return <Page title={t('lesson.title')}>{t('common.loading')}</Page>;
  }
  if (state.status === 'error')
    return (
      <Page title={t('lesson.title')}>
        <EmptyState>{t('path.loadError')}</EmptyState>
      </Page>
    );
  if (state.status === 'missing') {
    return (
      <Page title={t('lesson.title')}>
        <EmptyState>{t('lesson.notFound')}</EmptyState>
        <Link to="/" className="mt-4 inline-block font-semibold text-primary underline">
          {t('common.back')}
        </Link>
      </Page>
    );
  }

  const lesson = state.bundle.lessons.find((l) => l.id === lessonId)!;
  if (summary) {
    const words = state.bundle.lexemes
      .filter((l) => lesson.newLexemeIds.includes(l.id))
      .map((l) => stripStress(l.lemma));
    return (
      <LessonComplete
        summary={summary}
        learned={words}
        learnedLabel={t('complete.words')}
        backTo="/"
        backLabel={t('complete.backToCourse')}
        onAgain={() => {
          setSummary(null);
          setRound((r) => r + 1);
        }}
      />
    );
  }
  if (items.length === 0) return null;
  return (
    <ExerciseSession
      key={round}
      exercises={items}
      ctx={ctx}
      contentVersion={state.bundle.contentVersion}
      onAnswer={(record) => void logAnswer(record)}
      onFinish={(s) => {
        void completeLesson(lesson.id, s.accuracy);
        setSummary(s);
      }}
      onQuit={() => void navigate('/')}
    />
  );
}
