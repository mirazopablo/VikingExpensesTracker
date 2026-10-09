"use client";

import { useState, useEffect, useCallback, startTransition, useRef } from 'react';

/**
 * SSR-safe custom hook for localStorage persistence with Two-Phase Hydration.
 * Prevents React hydration mismatch errors in Next.js App Router by ensuring
 * the initial server render matches the initial client render exactly.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // Phase 1: Always initialize with pure initialValue on both Server and Client first pass
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const initialValueRef = useRef<T>(initialValue);
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // Phase 2: Client-side hydration effect after mounting
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      const valueToSet = item !== null ? JSON.parse(item) : initialValueRef.current;
      startTransition(() => {
        setStoredValue(valueToSet);
        setIsHydrated(true);
      });
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      startTransition(() => {
        setIsHydrated(true);
      });
    }
  }, [key]);

  // Synchronized setter wrapped in useCallback to maintain reference stability
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue(prev => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error writing localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue, isHydrated];
}
