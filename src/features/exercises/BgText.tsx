import type { ReactNode } from 'react';
import { AudioButton } from './AudioButton';

/** A Bulgarian prompt with its play buttons (Space replays). */
export function BgPrompt({
  text,
  children,
  autoPlay = true,
}: {
  text: string;
  children?: ReactNode;
  autoPlay?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <AudioButton text={text} autoPlay={autoPlay} shortcut />
      <p lang="bg" className="text-3xl font-bold">
        {children ?? text}
      </p>
    </div>
  );
}
