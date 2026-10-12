import { speakBulgarian, useBulgarianVoice } from '../../lib/speech';
import { useT } from '../../i18n';

/** Plays Bulgarian text with the device voice; renders nothing if there is no Bulgarian voice. */
export function ListenButton({ text }: { text: string }) {
  const t = useT();
  const available = useBulgarianVoice();
  if (!available) return null;
  return (
    <button
      type="button"
      onClick={() => speakBulgarian(text)}
      className="inline-flex min-h-11 items-center gap-2 rounded-card border border-border bg-surface px-3 font-semibold text-primary hover:bg-surface-2"
    >
      <span aria-hidden="true">🔊</span> {t('alphabet.listen')}
    </button>
  );
}
