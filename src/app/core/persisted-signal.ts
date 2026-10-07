import { WritableSignal, effect, signal } from '@angular/core';

/** Signal que se guarda en localStorage. Debe crearse en un contexto de inyección. */
export function persistedSignal<T>(key: string, initial: T): WritableSignal<T> {
  let start = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) start = JSON.parse(raw);
  } catch {
    // dato corrupto: se usa el valor inicial
  }
  const state = signal<T>(start);
  effect(() => localStorage.setItem(key, JSON.stringify(state())));
  return state;
}
