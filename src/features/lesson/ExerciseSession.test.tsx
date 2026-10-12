import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '../../app/user-store';
import type { AlphabetLetter, Lexeme } from '../../content/schema';
import { defaultUserState } from '../../db/records';
import type { AlphabetExercise } from '../../engine/session/alphabet';
import type { ExerciseContext } from '../exercises/types';
import { ExerciseSession } from './ExerciseSession';

// Fixture letters/words only exercise the player; they are not course content.
const sht: AlphabetLetter = {
  lower: 'щ',
  upper: 'Щ',
  latin: 'sht',
  sound: 'sht',
  hint: { en: 'sht as in ashtray', tr: 'şt' },
  exampleLexemeId: 'lex.kashta',
  reviewStatus: 'ai_draft',
};
const kashta: Lexeme = {
  id: 'lex.kashta',
  lemma: 'къ́ща',
  pos: 'noun',
  gender: 'f',
  translations: { en: ['house'], tr: ['ev'] },
  cefr: 'A1',
  tags: [],
  reviewStatus: 'ai_draft',
  sources: ['own'],
};

const intro: AlphabetExercise = {
  type: 'alphabet_intro',
  id: 'i',
  targets: ['letter.щ'],
  letter: sht,
  example: kashta,
};
const choice: AlphabetExercise = {
  type: 'alphabet_letter_sound',
  id: 'c',
  targets: ['letter.щ'],
  direction: 'letter_to_sound',
  letter: sht,
  options: ['sh', 'sht', 'ch', 'ts'],
  answerIndex: 1,
};
const typing: AlphabetExercise = {
  type: 'alphabet_type_word',
  id: 't',
  targets: ['lex.kashta'],
  word: kashta,
  latin: 'kashta',
  meaning: { en: 'house', tr: 'ev' },
  answer: 'къща',
};

const ctx = (settings: Partial<ExerciseContext['settings']> = {}): ExerciseContext => ({
  lang: 'en',
  settings: { ...defaultUserState().settings, ...settings },
});

beforeEach(() => {
  useUserStore.setState({ user: defaultUserState(), ready: true });
});

function setup(exercises: AlphabetExercise[], c = ctx()) {
  const onAnswer = vi.fn();
  const onFinish = vi.fn();
  const onQuit = vi.fn();
  render(
    <ExerciseSession
      exercises={exercises}
      ctx={c}
      onAnswer={onAnswer}
      onFinish={onFinish}
      onQuit={onQuit}
    />,
  );
  return { onAnswer, onFinish, onQuit, user: userEvent.setup() };
}

describe('ExerciseSession', () => {
  it('shows an intro card that only needs Continue', async () => {
    const { onFinish, onAnswer, user } = setup([intro]);
    expect(screen.getByText('New letter')).toBeInTheDocument();
    expect(screen.getByText('sht as in ashtray')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onFinish).toHaveBeenCalledWith({ accuracy: 1, gradedCount: 0 });
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('recycles a wrong answer to the end until it is right', async () => {
    const { onFinish, onAnswer, user } = setup([choice, intro]);
    const check = () => screen.getByRole('button', { name: 'Check' });
    expect(check()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /sh$/ }));
    await user.click(check());
    expect(screen.getByText('Not quite.')).toBeInTheDocument();
    expect(screen.getByText("You'll see this one again at the end.")).toBeInTheDocument();
    expect(onAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        inputMode: 'choice',
        result: expect.objectContaining({ verdict: 'incorrect' }) as unknown,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' })); // intro
    // The missed exercise is back, fresh.
    expect(screen.getByRole('button', { name: /sht$/ })).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('2'); // number key picks option 2
    await user.keyboard('{Enter}'); // Enter = Check
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.keyboard('{Enter}'); // Enter = Continue
    expect(onFinish).toHaveBeenCalledWith({ accuracy: 0, gradedCount: 1 });
  });

  it('types with phonetic typing from a Latin keyboard', async () => {
    const { onAnswer, user } = setup([typing]);
    await user.type(screen.getByLabelText('Your answer'), 'kyo]a');
    expect(screen.getByLabelText('Your answer')).toHaveValue('къоща');
    await user.keyboard('{Backspace}{Backspace}{Backspace}');
    await user.type(screen.getByLabelText('Your answer'), ']a');
    expect(screen.getByLabelText('Your answer')).toHaveValue('къща');
    await user.keyboard('{Enter}');
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ inputMode: 'typed' }));
  });

  it('types with the on-screen keyboard', async () => {
    const { onAnswer, user } = setup([typing]);
    const keyboard = screen.getByRole('group', { name: 'Cyrillic keyboard' });
    for (const letter of ['к', 'ъ', 'щ', 'щ']) await user.click(within(keyboard, letter));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(keyboard, 'а'));
    expect(screen.getByLabelText('Your answer')).toHaveValue('къща');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ inputMode: 'onscreen_keyboard' }),
    );
  });

  it('asks for Cyrillic instead of grading Latin input', async () => {
    const { onAnswer, user } = setup(
      [typing],
      ctx({ phoneticTyping: false, onScreenKeyboard: false }),
    );
    expect(screen.queryByRole('group', { name: 'Cyrillic keyboard' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Your answer'), 'kashta');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please type in Cyrillic');
    expect(onAnswer).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Show keyboard' }));
    expect(screen.getByRole('group', { name: 'Cyrillic keyboard' })).toBeInTheDocument();
  });

  it('forgives a typo in a long word and shows the note', async () => {
    const long: AlphabetExercise = { ...typing, id: 't2', answer: 'шоколад', latin: 'shokolad' };
    const { user } = setup([long], ctx({ phoneticTyping: false }));
    await user.type(screen.getByLabelText('Your answer'), 'шокалад');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct — but check the spelling.')).toBeInTheDocument();
    expect(screen.getByText(/Small typo/)).toBeInTheDocument();
  });

  it('shows the right answer and the diff on a wrong typed answer', async () => {
    const { user } = setup([typing], ctx({ phoneticTyping: false }));
    await user.type(screen.getByLabelText('Your answer'), 'кашта');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Correct answer:')).toBeInTheDocument();
    expect(screen.getAllByText('къща').length).toBeGreaterThan(0);
  });

  it('quits', async () => {
    const { onQuit, user } = setup([intro]);
    await user.click(screen.getByRole('button', { name: 'Quit lesson' }));
    expect(onQuit).toHaveBeenCalled();
  });
});

function within(group: HTMLElement, letter: string): HTMLElement {
  const button = [...group.querySelectorAll('button')].find(
    (b) => b.firstChild?.textContent === letter,
  );
  if (!button) throw new Error(`no key ${letter}`);
  return button;
}
