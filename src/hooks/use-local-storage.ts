
"use client";

import { useState, useEffect, useCallback } from "react";

// Hook to check if the code is running in the browser
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isClient = useIsClient();

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (isClient) {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            } else {
                window.localStorage.setItem(key, JSON.stringify(initialValue));
            }
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
        }
    }
  }, [key, initialValue, isClient]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (!isClient) {
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue, isClient]);

  return [storedValue, setValue];
}
