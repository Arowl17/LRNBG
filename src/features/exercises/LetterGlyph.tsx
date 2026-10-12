import type { AlphabetLetter } from '../../content/schema';

/** A letter shown big in both cases: "Щ щ". */
export function LetterGlyph({
  letter,
  size = 'text-7xl',
}: {
  letter: AlphabetLetter;
  size?: string;
}) {
  return (
    <p lang="bg" className={`text-center font-bold ${size}`}>
      {letter.upper} {letter.lower}
    </p>
  );
}
