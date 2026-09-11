/**
 * Small "fetch on mount (and whenever deps change), track loading/error/
 * data" hook - every page in Phase 3 that loads data from a service
 * function uses this instead of hand-rolling the same three useState
 * calls repeatedly. Not a general-purpose data-fetching library (no
 * caching, no dedup) - just enough structure to keep page components
 * focused on what to render, not on request bookkeeping.
 *
 * Usage:
 *   const { data: letters, isLoading, error, reload } = useAsyncData(
 *     () => fetchLetters({ page }),
 *     [page]
 *   );
 */
import { useCallback, useEffect, useState } from 'react';
import { extractErrorMessage } from '../services/apiClient';

interface AsyncDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: React.DependencyList): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    // Guards against a slow first request resolving after a faster
    // second one (e.g. rapid page-number clicks) and overwriting newer
    // data with stale data.
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  return { data, isLoading, error, reload };
}
