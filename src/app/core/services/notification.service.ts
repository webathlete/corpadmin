import { Injectable, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AsyncSubject, Observable, Subject, Subscription, concatMap, delay, map, tap, timer } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationRequest {
  message: string;
  type?: NotificationType;
  /** Milliseconds the toast stays visible. Defaults by type — errors linger longer. */
  duration?: number;
  /** Action button label, e.g. "Undo" — omit for a plain "Dismiss". */
  actionLabel?: string;
  /** Called if the user clicks the action button. */
  onAction?: () => void;
}

/** A past notification as kept in `NotificationService.history` — for a
 *  notification-center style listing, independent of the toast queue. */
export interface NotificationHistoryItem {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
}

interface QueuedNotification extends NotificationRequest {
  // AsyncSubject, not Subject: this stands in for the single deferred result
  // of "this notification finished its turn" — the same one-shot, replay-if-
  // completed-first shape a Promise had. A late subscriber (e.g. code that
  // calls .subscribe() a tick after notify() returns) still gets the value,
  // because AsyncSubject replays its last next() to subscribers that arrive
  // before complete() — a plain Subject would silently drop it for them.
  done$: AsyncSubject<void>;
}

const DEFAULT_DURATION: Record<NotificationType, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 6000,
};

const MAX_HISTORY = 30;

/** Quiet gap enforced between one toast dismissing and the next queued one
 *  appearing — long enough to reach for the bell and act on what's showing
 *  (mark it read, dismiss it) before the next toast steals the same corner
 *  of the screen. Only matters when the queue actually has a backlog; a
 *  single notify() call with nothing else queued is unaffected. */
const QUEUE_GAP_MS = 600;

/** Pool for `startSimulation()` — stand-ins for events a real backend would
 *  push over a websocket/SSE connection (job status, system health, activity). */
const SIMULATED_EVENTS: { message: string; type: NotificationType }[] = [
  { message: 'Nightly ETL job completed successfully', type: 'success' },
  { message: 'New comment on Q3 budget report', type: 'info' },
  { message: 'API latency spike detected in eu-west-2', type: 'warning' },
  { message: 'Payment failed for invoice #4021', type: 'error' },
  { message: 'New team member joined: Priya Sharma', type: 'info' },
  { message: 'Database backup completed', type: 'success' },
  { message: 'Disk usage above 90% on db-primary', type: 'warning' },
  { message: 'Server unreachable: worker-node-7', type: 'error' },
  { message: 'Weekly analytics digest is ready', type: 'info' },
  { message: 'Certificate renewed for api.corpadmin.io', type: 'success' },
];

/**
 * App-wide toast notifications, queued so bursts of calls play one at a time
 * instead of clobbering each other — `MatSnackBar` on its own only shows one
 * snackbar at a time and silently dismisses whatever's currently showing the
 * moment `.open()` is called again.
 *
 * `notify()` (and the success/error/warning/info shortcuts) enqueue
 * immediately — the toast fires whether or not anyone subscribes — and
 * return an `Observable<void>` that emits once that notification has had
 * its turn and been dismissed. `concatMap` on the intake stream is what
 * gives the queue processing: it holds each subsequent item back until the
 * previous one's `afterDismissed()` completes (plus a short `QUEUE_GAP_MS`
 * pause — see `show()` — so the screen has a quiet beat between toasts to
 * actually reach the bell and act on one before the next takes over the
 * same corner), so callers that don't care can fire-and-forget, and callers
 * that want to sequence work after a toast finishes can subscribe (or
 * `firstValueFrom`) it.
 *
 * Every call also lands in `history` (capped, newest first) regardless of
 * toast timing — a notification-center UI can list/mark-read/clear it
 * independently of whether its toast has played yet.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  // Plain Subject — this is a command stream ("queue this"), not a value
  // with a "current state" to replay. The single internal subscriber below
  // is wired up for the service's whole lifetime, so there's no late
  // subscriber to worry about; a BehaviorSubject/ReplaySubject would be the
  // wrong tool here since replaying a past "queue this" command to a new
  // subscriber would mean re-processing an item that's already been shown.
  private readonly intake$ = new Subject<QueuedNotification>();
  private readonly pending: QueuedNotification[] = [];

  private readonly historySignal = signal<NotificationHistoryItem[]>([]);
  private simSub: Subscription | null = null;

  /** Number of notifications waiting behind the one currently shown. */
  readonly queueLength = signal(0);
  /** The notification currently on screen, or null between/before turns. */
  readonly current = signal<NotificationRequest | null>(null);
  /** Newest-first log of past notifications, capped at 30 — independent of
   *  the toast queue, for a notification-center style listing. */
  readonly history = this.historySignal.asReadonly();
  readonly unreadCount = computed(() => this.historySignal().filter(n => !n.read).length);
  /** Whether `startSimulation()` is currently pushing events on a timer. */
  readonly simulating = signal(false);

  constructor() {
    this.intake$.pipe(concatMap(item => this.show(item))).subscribe();
  }

  notify(request: NotificationRequest): Observable<void> {
    const type = request.type ?? 'info';
    const item: QueuedNotification = { ...request, type, done$: new AsyncSubject<void>() };

    this.pending.push(item);
    this.queueLength.set(this.pending.length);

    this.historySignal.update(list => [
      { id: crypto.randomUUID(), message: request.message, type, timestamp: Date.now(), read: false },
      ...list,
    ].slice(0, MAX_HISTORY));

    this.intake$.next(item);
    return item.done$.asObservable();
  }

  success(message: string, opts?: Omit<NotificationRequest, 'message' | 'type'>): Observable<void> {
    return this.notify({ message, type: 'success', ...opts });
  }

  error(message: string, opts?: Omit<NotificationRequest, 'message' | 'type'>): Observable<void> {
    return this.notify({ message, type: 'error', ...opts });
  }

  warning(message: string, opts?: Omit<NotificationRequest, 'message' | 'type'>): Observable<void> {
    return this.notify({ message, type: 'warning', ...opts });
  }

  info(message: string, opts?: Omit<NotificationRequest, 'message' | 'type'>): Observable<void> {
    return this.notify({ message, type: 'info', ...opts });
  }

  markRead(id: string): void {
    this.historySignal.update(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllRead(): void {
    this.historySignal.update(list => list.map(n => ({ ...n, read: true })));
  }

  clearHistory(): void {
    this.historySignal.set([]);
  }

  removeOne(id: string): void {
    this.historySignal.update(list => list.filter(n => n.id !== id));
  }

  /** Starts pushing simulated events (a random pick from `SIMULATED_EVENTS`)
   *  every 6–14s (jittered, not fixed-interval — closer to how real
   *  event traffic arrives), standing in for a real websocket/SSE-driven
   *  backend feed. Idempotent — calling it again while already running is a
   *  no-op. Each firing reschedules itself, so `stopSimulation()` just has
   *  to cancel the one pending timer to halt the whole chain. */
  startSimulation(): void {
    if (this.simulating()) return;
    this.simulating.set(true);
    this.scheduleNextSimulatedEvent();
  }

  stopSimulation(): void {
    this.simSub?.unsubscribe();
    this.simSub = null;
    this.simulating.set(false);
  }

  private scheduleNextSimulatedEvent(): void {
    const waitMs = 6000 + Math.random() * 8000;
    this.simSub = timer(waitMs).subscribe(() => {
      const event = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
      this.notify(event);
      if (this.simulating()) this.scheduleNextSimulatedEvent();
    });
  }

  private show(item: QueuedNotification): Observable<void> {
    this.pending.shift();
    this.queueLength.set(this.pending.length);
    this.current.set(item);

    const type = item.type ?? 'info';
    const ref = this.snackBar.open(item.message, item.actionLabel ?? 'Dismiss', {
      duration: item.duration ?? DEFAULT_DURATION[type],
      panelClass: [`notify-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });

    if (item.onAction) {
      ref.onAction().subscribe(() => item.onAction?.());
    }

    return ref.afterDismissed().pipe(
      tap(() => {
        this.current.set(null);
        item.done$.next();
        item.done$.complete();
      }),
      map(() => undefined),
      // Placed after the tap/map above (not before): `current` clears and
      // the caller's Observable resolves the instant the toast actually
      // dismisses — this delay only holds concatMap back from starting the
      // *next* queued item, it doesn't stretch out this one's own lifetime.
      delay(QUEUE_GAP_MS),
    );
  }
}
