import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Transaction {
  id: string;
  customer: string;
  channel: string;
  region: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Failed';
  date: Date;
}

const CUSTOMERS = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Stark Ind.', 'Wayne Ent.', 'Wonka', 'Hooli', 'Pied Piper'];
const CHANNELS = ['Web', 'Mobile', 'Partner', 'In-store'];
const REGIONS = ['North America', 'EMEA', 'APAC', 'LATAM'];
const STATUSES: Transaction['status'][] = ['Completed', 'Pending', 'Refunded', 'Failed'];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

const DATA: Transaction[] = Array.from({ length: 120 }, (_, i) => ({
  id: `TXN-${(10248 + i)}`,
  customer: pick(CUSTOMERS, i * 3 + 1),
  channel: pick(CHANNELS, i + 2),
  region: pick(REGIONS, i * 2),
  amount: Math.round((Math.random() * 9800 + 200)),
  status: pick(STATUSES, i * 5 + (i % 3)),
  date: new Date(2026, 5, 1 + (i % 28), 9 + (i % 12), (i * 7) % 60),
}));

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  /** Simulates an async API call with network latency. */
  getTransactions(): Observable<Transaction[]> {
    return of(DATA).pipe(delay(1200));
  }
}
