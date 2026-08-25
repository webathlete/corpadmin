import { Component, OnDestroy, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule, MatButtonToggleChange } from '@angular/material/button-toggle';
import { NotificationHistoryItem, NotificationService, NotificationType } from '../../core/services/notification.service';

const TYPE_ICON: Record<NotificationType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const TYPE_COLOR: Record<NotificationType, string> = {
  success: 'var(--status-success)',
  error: 'var(--status-error)',
  warning: 'var(--status-warning)',
  info: 'var(--app-primary)',
};

const PULSE_DURATION_MS = 900;

type NotificationTab = 'all' | 'unread';

interface NotificationGroup {
  label: string;
  items: NotificationHistoryItem[];
}

/**
 * Bell icon that opens a slide-in "notification center" drawer (same
 * pattern as the app's Theme Customizer / Info Drawer) listing
 * `NotificationService.history` — live, with no wiring needed beyond
 * dropping this component in. All/Unread tabs filter the list; items are
 * grouped under Today/Earlier headers.
 *
 * Each unread item has an explicit "Read" button, and every item has its
 * own remove button. The bell briefly rings (shake + expanding ring)
 * whenever unread count goes up, so an arrival is noticeable even with the
 * drawer closed.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatBadgeModule, MatTooltipModule, MatButtonToggleModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnDestroy {
  private readonly notify = inject(NotificationService);

  // Empty by default, so the trigger icon inherits its context's normal
  // text color (fine on a plain card). Pass a CSS color — e.g. a toolbar's
  // own icon token — when dropping this into a colored header/toolbar.
  readonly iconColor = input<string>('');

  readonly history = this.notify.history;
  readonly unreadCount = this.notify.unreadCount;
  readonly badgeLabel = computed(() => (this.unreadCount() > 9 ? '9+' : `${this.unreadCount()}`));

  readonly drawerOpen = signal(false);
  readonly activeTab = signal<NotificationTab>('all');

  readonly filteredHistory = computed(() => {
    const items = this.history();
    return this.activeTab() === 'unread' ? items.filter(n => !n.read) : items;
  });

  readonly groupedHistory = computed<NotificationGroup[]>(() => {
    const todayStr = new Date().toDateString();
    const today: NotificationHistoryItem[] = [];
    const earlier: NotificationHistoryItem[] = [];
    for (const n of this.filteredHistory()) {
      (new Date(n.timestamp).toDateString() === todayStr ? today : earlier).push(n);
    }
    const groups: NotificationGroup[] = [];
    if (today.length) groups.push({ label: 'Today', items: today });
    if (earlier.length) groups.push({ label: 'Earlier', items: earlier });
    return groups;
  });

  readonly ringing = signal(false);
  private lastUnreadCount = 0;
  private ringTimeout?: ReturnType<typeof setTimeout>;

  // Backs relativeTime(): a signal ticked once a second, rather than calling
  // Date.now() straight from the template. A plain Date.now() read inside a
  // template expression can return a different value on Angular's dev-mode
  // double-check pass than it did a moment earlier in the same tick (e.g.
  // "9s ago" → "10s ago" right at the boundary), which throws NG0100. `now`
  // only changes once per interval tick, so both checks in the same pass see
  // the same value — and as a bonus, the labels actually live-update instead
  // of going stale until the next unrelated re-render.
  private readonly now = signal(Date.now());
  private readonly nowInterval = setInterval(() => this.now.set(Date.now()), 1000);

  constructor() {
    // allowSignalWrites: `ringing` is a UI-only side-effect signal that
    // nothing upstream of `unreadCount` reads, so there's no risk of the
    // write feeding back into this same effect — the case the default
    // restriction exists to catch.
    effect(() => {
      const count = this.unreadCount();
      if (count > this.lastUnreadCount) {
        clearTimeout(this.ringTimeout);
        this.ringing.set(false);
        // Re-triggering the animation needs a frame where the class is
        // absent, or a rapid second arrival won't restart it.
        requestAnimationFrame(() => {
          this.ringing.set(true);
          this.ringTimeout = setTimeout(() => this.ringing.set(false), PULSE_DURATION_MS);
        });
      }
      this.lastUnreadCount = count;
    }, { allowSignalWrites: true });
  }

  iconFor(type: NotificationType): string {
    return TYPE_ICON[type];
  }

  colorFor(type: NotificationType): string {
    return TYPE_COLOR[type];
  }

  relativeTime(timestamp: number): string {
    const seconds = Math.floor((this.now() - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  setTab(change: MatButtonToggleChange): void {
    this.activeTab.set(change.value as NotificationTab);
  }

  read(id: string): void {
    this.notify.markRead(id);
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.notify.removeOne(id);
  }

  markAllRead(): void {
    this.notify.markAllRead();
  }

  clear(): void {
    this.notify.clearHistory();
  }

  ngOnDestroy(): void {
    clearInterval(this.nowInterval);
    clearTimeout(this.ringTimeout);
  }
}
