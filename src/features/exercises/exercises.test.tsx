import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '../../app/user-store';
import type { Exercise, GrammarPoint, Lexeme } from '../../content/schema';
import { defaultUserState } from '../../db/records';
import type { LessonItem } from '../../engine/session/lesson';
import { ExerciseSession } from '../lesson/ExerciseSession';
import type { ExerciseContext } from './types';

// Fixture Bulgarian only exercises the components; it is not course content.

const ctx = (lang: 'en' | 'tr' = 'en'): ExerciseContext => ({
  lang,
  settings: { ...defaultUserState().settings, phoneticTyping: false, onScreenKeyboard: false },
});
const meaning = { en: 'I am a student.', tr: 'Ben öğrenciyim.' };
const base = { targets: ['lex.sam'], reviewStatus: 'ai_draft' as const };

beforeEach(() => {
  useUserStore.setState({ user: defaultUserState(), ready: true });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('', { status: 404 }))),
  );
});

function run(items: LessonItem[], lang: 'en' | 'tr' = 'en') {
  useUserStore.setState({ user: { ...defaultUserState(), sourceLanguage: lang }, ready: true });
  const onAnswer = vi.fn();
  const onFinish = vi.fn();
  render(
    <ExerciseSession
      exercises={items}
      ctx={ctx(lang)}
      onAnswer={onAnswer}
      onFinish={onFinish}
      onQuit={() => {}}
    />,
  );
  return { onAnswer, onFinish, user: userEvent.setup() };
}

const verdict = (onAnswer: ReturnType<typeof vi.fn>) =>
  (onAnswer.mock.lastCall?.[0] as { result: { verdict: string } }).result.verdict;

describe('select_meaning', () => {
  const ex: Exercise = {
    ...base,
    id: 'ex.t.sm',
    type: 'select_meaning',
    bg: 'студент',
    options: [
      { en: 'teacher', tr: 'öğretmen' },
      { en: 'student', tr: 'öğrenci' },
    ],
    answerIndex: 1,
  };
  it('shows options in the learner language and grades the choice', async () => {
    const { onAnswer, user } = run([ex], 'tr');
    await user.click(screen.getByRole('button', { name: /öğrenci$/ }));
    await user.click(screen.getByRole('button', { name: 'Kontrol et' }));
    expect(verdict(onAnswer)).toBe('correct');
  });
});

describe('tiles_translate', () => {
  const toBg: Exercise = {
    ...base,
    id: 'ex.t.tt',
    type: 'tiles_translate',
    bg: 'Аз съм студент.',
    meaning,
    direction: 'src_to_bg',
    accepted: { bg: ['{Аз |}съм студент.', 'Студент съм.'] },
    distractors: { bg: ['е'] },
    strictTokens: ['съм'],
  };
  it('builds a Bulgarian answer from tiles; removing a tile works; alternatives are accepted', async () => {
    const { onAnswer, user } = run([toBg]);
    expect(screen.getByText('I am a student.')).toBeInTheDocument();
    const bank = screen.getByRole('group', { name: 'Word bank' });
    await user.click(within(bank).getByRole('button', { name: /е$/ }));
    const answer = screen.getByRole('group', { name: 'Your answer' });
    await user.click(within(answer).getByRole('button', { name: 'е' })); // take it back
    await user.click(within(bank).getByRole('button', { name: /студент$/ }));
    await user.click(within(bank).getByRole('button', { name: /съм$/ }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(verdict(onAnswer)).toBe('correct'); // "Студент съм." is an accepted answer
  });

  it('marks a wrong grammar word with a note', async () => {
    const { onAnswer, user } = run([toBg]);
    const bank = screen.getByRole('group', { name: 'Word bank' });
    for (const w of ['Аз', 'е', 'студент'])
      await user.click(within(bank).getByRole('button', { name: new RegExp(`${w}$`) }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(verdict(onAnswer)).toBe('incorrect');
    expect(screen.getByText(/Check this word/)).toBeInTheDocument();
  });

  it('works from Bulgarian into the source language with keyboard shortcuts', async () => {
    const fromBg: Exercise = {
      ...base,
      id: 'ex.t.tt2',
      type: 'tiles_translate',
      bg: 'Аз съм студент.',
      meaning,
      direction: 'bg_to_src',
      accepted: { en: ['I am a student.'], tr: ['{Ben |}öğrenciyim.'] },
      distractors: { en: ['teacher'], tr: ['öğretmen'] },
    };
    const { onAnswer, user } = run([fromBg], 'tr');
    const bank = screen.getByRole('group', { name: 'Kelime bankası' });
    const labels = within(bank)
      .getAllByRole('button')
      .map((b) => (b.textContent ?? '').replace(/^\d/, ''));
    await user.keyboard(String(labels.indexOf('öğrenciyim') + 1));
    await user.keyboard('{Enter}');
    expect(verdict(onAnswer)).toBe('correct');
  });
});

describe('type_translate', () => {
  it('accepts a typed English answer', async () => {
    const ex: Exercise = {
      ...base,
      id: 'ex.t.ty',
      type: 'type_translate',
      bg: 'Аз съм студент.',
      meaning,
      direction: 'bg_to_src',
      accepted: { en: ["{I'm|I am} a student."], tr: ['Ben öğrenciyim.'] },
    };
    const { onAnswer, user } = run([ex]);
    await user.type(screen.getByLabelText('Your answer'), "i'm a student");
    await user.keyboard('{Enter}');
    expect(verdict(onAnswer)).toBe('correct');
  });

  it('asks for Cyrillic when translating into Bulgarian with Latin letters', async () => {
    const ex: Exercise = {
      ...base,
      id: 'ex.t.ty2',
      type: 'type_translate',
      bg: 'Аз съм студент.',
      meaning,
      direction: 'src_to_bg',
      accepted: { bg: ['Аз съм студент.'] },
    };
    const { onAnswer, user } = run([ex]);
    expect(screen.getByText('Write this in Bulgarian')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your answer'), 'az sam student');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent(/Cyrillic/);
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

describe('listening', () => {
  it('listen_tiles and listen_type grade Bulgarian answers', async () => {
    const lt: Exercise = {
      ...base,
      id: 'ex.t.lt',
      type: 'listen_tiles',
      bg: 'Добър ден.',
      meaning: { en: 'Good day.', tr: 'İyi günler.' },
      accepted: ['Добър ден.'],
      distractors: ['вечер'],
    };
    const ly: Exercise = {
      ...base,
      id: 'ex.t.ly',
      type: 'listen_type',
      bg: 'Добър ден.',
      meaning: { en: 'Good day.', tr: 'İyi günler.' },
      accepted: ['Добър ден.'],
    };
    const { onAnswer, user } = run([lt, ly]);
    expect(screen.getByText('Tap what you hear')).toBeInTheDocument();
    const bank = screen.getByRole('group', { name: 'Word bank' });
    await user.click(within(bank).getByRole('button', { name: /Добър$/ }));
    await user.click(within(bank).getByRole('button', { name: /ден$/ }));
    await user.keyboard('{Enter}');
    expect(verdict(onAnswer)).toBe('correct');
    expect(screen.getByText('Good day.')).toBeInTheDocument(); // meaning revealed after checking
    await user.keyboard('{Enter}');
    await user.type(screen.getByLabelText('Your answer'), 'добър ден');
    await user.keyboard('{Enter}');
    expect(verdict(onAnswer)).toBe('correct');
  });
});

const PAIRS: [string, string][] = [
  ['да', 'yes'],
  ['не', 'no'],
  ['чай', 'tea'],
];

describe('match_pairs', () => {
  const ex: Exercise = {
    ...base,
    id: 'ex.t.mp',
    type: 'match_pairs',
    pairs: [
      { bg: 'да', meaning: { en: 'yes', tr: 'evet' } },
      { bg: 'не', meaning: { en: 'no', tr: 'hayır' } },
      { bg: 'чай', meaning: { en: 'tea', tr: 'çay' } },
    ],
  };
  it('is correct when everything is matched without mistakes', async () => {
    const { onAnswer, user } = run([ex]);
    const check = screen.getByRole('button', { name: 'Check' });
    for (const [bg, en] of PAIRS) {
      expect(check).toBeDisabled();
      await user.click(screen.getByRole('button', { name: bg }));
      await user.click(screen.getByRole('button', { name: en }));
    }
    await user.click(check);
    expect(verdict(onAnswer)).toBe('correct');
  });

  it('a wrong pairing makes it come back', async () => {
    const { onAnswer, user } = run([ex]);
    await user.click(screen.getByRole('button', { name: 'да' }));
    await user.click(screen.getByRole('button', { name: 'no' }));
    for (const [bg, en] of PAIRS) {
      await user.click(screen.getByRole('button', { name: en })); // right side first works too
      await user.click(screen.getByRole('button', { name: bg }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(verdict(onAnswer)).toBe('incorrect');
    expect(screen.queryByText('Correct answer:')).not.toBeInTheDocument();
  });
});

describe('fill_blank', () => {
  it('fills the gap and shows the explanation after checking', async () => {
    const ex: Exercise = {
      ...base,
      id: 'ex.t.fb',
      type: 'fill_blank',
      bg: 'Ти ___ студент.',
      meaning: { en: 'You are a student.', tr: 'Sen öğrencisin.' },
      options: ['е', 'си', 'съм'],
      answerIndex: 1,
      explanation: { en: 'With ти use си.', tr: 'Ti ile si kullanılır.' },
    };
    const { onAnswer, user } = run([ex]);
    await user.click(screen.getByRole('button', { name: /си$/ }));
    expect(screen.getAllByText('си').length).toBeGreaterThan(1); // shown in the gap too
    await user.keyboard('{Enter}');
    expect(verdict(onAnswer)).toBe('correct');
    expect(screen.getByText('With ти use си.')).toBeInTheDocument();
  });
});

describe('cards', () => {
  it('shows grammar tips and new words, ungraded', async () => {
    const grammar: GrammarPoint = {
      id: 'gram.t',
      title: { en: 'To be', tr: 'Olmak' },
      cefr: 'A1',
      explanation: { en: 'Use **съм**.', tr: '**съм** kullan.' },
      examples: [{ bg: 'Аз съм тук.', en: 'I am here.', tr: 'Buradayım.' }],
      prerequisites: [],
      reviewStatus: 'ai_draft',
    };
    const lexeme: Lexeme = {
      id: 'lex.student',
      lemma: 'студе́нт',
      pos: 'noun',
      gender: 'm',
      translations: { en: ['student'], tr: ['öğrenci'] },
      cefr: 'A1',
      tags: [],
      reviewStatus: 'ai_draft',
      sources: ['own'],
    };
    const { onFinish, onAnswer, user } = run([
      { type: 'grammar_tip', id: 'tip.gram.t', targets: ['gram.t'], grammar },
      { type: 'word_intro', id: 'intro.lex.student', targets: ['lex.student'], lexeme },
    ]);
    expect(screen.getByRole('heading', { name: 'To be' })).toBeInTheDocument();
    expect(screen.getByText('съм').tagName).toBe('STRONG');
    expect(screen.getByText('I am here.')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByText('студе́нт')).toBeInTheDocument(); // stress shown on new words
    expect(screen.getByText('Masculine noun')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onFinish).toHaveBeenCalledWith({ accuracy: 1, gradedCount: 0 });
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
