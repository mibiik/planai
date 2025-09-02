import { useState, useEffect } from 'react';
import { SchedulerEvent, WorkSession } from '../types';

// A type guard to check if an object is a WorkSession
function isWorkSession(obj: any): obj is WorkSession {
  return typeof obj === 'object' && obj !== null && 'duration' in obj && 'type' in obj;
}

// A type guard to check if an object is a SchedulerEvent
function isSchedulerEvent(obj: any): obj is SchedulerEvent {
  return typeof obj === 'object' && obj !== null && 'start' in obj && 'end' in obj;
}


export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // Revive dates
        const parsed = JSON.parse(item);

        if (initialValue instanceof Date && typeof parsed === 'string') {
          const date = new Date(parsed);
          if (!isNaN(date.getTime())) {
            return date as T;
          }
        }

        if (Array.isArray(parsed)) {
          return parsed.map(entry => {
            if (isSchedulerEvent(entry)) {
                return { ...entry, start: new Date(entry.start), end: new Date(entry.end), category: entry.category || 'other', completed: entry.completed || false };
            }
            if (isWorkSession(entry)) {
                return { ...entry, date: new Date(entry.date) };
            }
            return entry;
          }) as T;
        }
        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = JSON.stringify(storedValue);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}