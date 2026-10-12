import { useEffect, useState } from 'react';

/*
 * Runtime fallback audio (SPEC §11): the device's own Bulgarian text-to-speech voice, if it has
 * one. Pre-generated audio files replace this in Phase 2. No voice → the play button is hidden.
 */

function synth(): SpeechSynthesis | undefined {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : undefined;
}

export function findBulgarianVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  return voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('bg'));
}

/** Speak Bulgarian text with the device voice. Returns false if no Bulgarian voice exists. */
export function speakBulgarian(text: string, rate = 1): boolean {
  const s = synth();
  const voice = s && findBulgarianVoice(s.getVoices());
  if (!s || !voice) return false;
  s.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate;
  s.speak(utterance);
  return true;
}

/** True once the device reports a Bulgarian voice (voices load asynchronously). */
export function useBulgarianVoice(): boolean {
  const [available, setAvailable] = useState(
    () => !!findBulgarianVoice(synth()?.getVoices() ?? []),
  );
  useEffect(() => {
    const s = synth();
    if (!s) return;
    const update = () => setAvailable(!!findBulgarianVoice(s.getVoices()));
    update();
    s.addEventListener('voiceschanged', update);
    return () => s.removeEventListener('voiceschanged', update);
  }, []);
  return available;
}
