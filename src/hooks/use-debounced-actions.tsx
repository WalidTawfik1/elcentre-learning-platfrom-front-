import { useState, useEffect, useCallback } from 'react';
import { debouncedSearch } from '@/lib/rate-limiter';

/**
 * Hook for debounced search functionality
 * Prevents excessive API calls during user input
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  debounceMs: number = 300,
  minCharacters: number = 2
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minCharacters) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await debouncedSearch(
        () => searchFunction(searchQuery),
        `search-${searchQuery}`,
        debounceMs
      );
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchFunction, debounceMs, minCharacters]);

  useEffect(() => {
    if (query.trim()) {
      performSearch(query.trim());
    } else {
      setResults(null);
      setIsLoading(false);
      setError(null);
    }
  }, [query, performSearch]);

  const reset = useCallback(() => {
    setQuery('');
    setResults(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    reset
  };
}

/**
 * Hook for debounced form submissions
 * Prevents double submissions and provides loading state
 */
export function useDebouncedSubmit<T>(
  submitFunction: () => Promise<T>,
  debounceMs: number = 300
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (isSubmitting) return; // Prevent double submissions

    setIsSubmitting(true);
    setError(null);

    try {
      const submitResult = await debouncedSearch(
        submitFunction,
        `submit-${Date.now()}`,
        debounceMs
      );
      setResult(submitResult);
      return submitResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFunction, debounceMs, isSubmitting]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsSubmitting(false);
  }, []);

  return {
    submit,
    isSubmitting,
    result,
    error,
    reset
  };
}

/**
 * Hook for rate-limited button clicks
 * Prevents rapid clicking that could trigger rate limiting
 */
export function useRateLimitedAction(
  action: () => Promise<void> | void,
  cooldownMs: number = 1000
) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);

  const executeAction = useCallback(async () => {
    const now = Date.now();
    
    // Check if still on cooldown
    if (now - lastActionTime < cooldownMs) {
      return;
    }

    setIsOnCooldown(true);
    setLastActionTime(now);

    try {
      await action();
    } finally {
      // Set cooldown timer
      setTimeout(() => {
        setIsOnCooldown(false);
      }, cooldownMs);
    }
  }, [action, cooldownMs, lastActionTime]);

  return {
    executeAction,
    isOnCooldown,
    canExecute: !isOnCooldown
  };
}
