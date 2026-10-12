import { describe, expect, it } from 'vitest';
import { answerWords, buildTiles } from './tiles';

describe('tiles', () => {
  it('takes words from the canonical expansion, stripping punctuation', () => {
    expect(answerWords('{Аз |}съм студент.')).toEqual(['Аз', 'съм', 'студент']);
    expect(answerWords('„Добро утро!“')).toEqual(['Добро', 'утро']);
    expect(answerWords('по-добре')).toEqual(['по-добре']);
  });

  it('adds distractors and shuffles deterministically per exercise', () => {
    const a = buildTiles('ex.1', 'Аз съм студент.', ['е', 'си']);
    expect(a.map((t) => t.text).sort()).toEqual(['Аз', 'е', 'си', 'студент', 'съм'].sort());
    expect(buildTiles('ex.1', 'Аз съм студент.', ['е', 'си'])).toEqual(a);
    expect(new Set(a.map((t) => t.id)).size).toBe(5);
  });
});
