import { signal, WritableSignal } from '@angular/core';

/**
 * Returns a boolean signal that starts `true` and flips to `false` after `ms`,
 * for demoing a page's initial load with <app-loading-bar>. In a real app,
 * drive the signal from your data/HTTP calls instead.
 *
 *   readonly loading = simulatedLoading();   // shows the bar for ~700ms
 */
export function simulatedLoading(ms = 700): WritableSignal<boolean> {
  const loading = signal(true);
  setTimeout(() => loading.set(false), ms);
  return loading;
}
