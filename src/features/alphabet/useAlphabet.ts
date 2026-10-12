import { useEffect, useState } from 'react';
import { loadAlphabet } from '../../content/loader';
import type { AlphabetBundle } from '../../content/schema';

export type AlphabetState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; bundle: AlphabetBundle };

export function useAlphabet(): AlphabetState {
  const [state, setState] = useState<AlphabetState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    loadAlphabet()
      .then((bundle) => !cancelled && setState({ status: 'ready', bundle }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
