/**
 * The API doc has no dedicated stats/aggregation endpoint (the PHP
 * app's Letter::getStats() had a SQL query backing it; here there's
 * just GET /letters). Dashboards fetch a large page of letters once
 * and compute the same breakdown client-side instead. Fine for a demo/
 * mock-server scale of data; if a real backend ever adds a stats
 * endpoint, swap the dashboard's data source, not this function's
 * shape, so callers don't need to change.
 */
import type { Letter } from '../types/api';

/** Stable empty-array reference for `data?.letters ?? EMPTY_LETTERS`
 *  fallbacks - using a fresh `[]` literal there instead would give
 *  useMemo/useEffect a "new" dependency every render while a fetch is
 *  still loading, defeating memoization for no reason. */
export const EMPTY_LETTERS: Letter[] = [];

export interface LetterStats {
  total: number;
  inProgress: number;
  delivered: number;
  undeliveredLiability: number;
}

const IN_PROGRESS_STATUSES = new Set(['Approved', 'Assigned', 'In_Transit']);

export function computeLetterStats(letters: Letter[]): LetterStats {
  let inProgress = 0;
  let delivered = 0;
  let undeliveredLiability = 0;

  for (const letter of letters) {
    if (IN_PROGRESS_STATUSES.has(letter.status)) inProgress += 1;
    if (letter.status === 'Delivered') delivered += 1;
    if (letter.status === 'Undelivered') undeliveredLiability += Number(letter.liabilityValue) || 0;
  }

  return {
    total: letters.length,
    inProgress,
    delivered,
    undeliveredLiability,
  };
}

/** Groups letters by day for the last N days (default 7, matching the
 *  PHP app's "This Week" delivery-trend default) - counts DELIVERED
 *  letters per day, keyed by a short weekday/date label for the chart's
 *  x-axis. */
export function computeDeliveryTrend(letters: Letter[], days = 7) {
  const buckets = new Map<string, number>();
  const labels: string[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toDateString();
    const label = days > 7 ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : date.toLocaleDateString('en-GB', { weekday: 'short' });
    buckets.set(key, 0);
    labels.push(label);
  }

  letters
    .filter((letter) => letter.status === 'Delivered' && letter.deliveredAt)
    .forEach((letter) => {
      const key = new Date(letter.deliveredAt as string).toDateString();
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    });

  return { labels, data: Array.from(buckets.values()) };
}

/** Counts letters per courier - used for the Admin dashboard's courier
 *  workload chart. */
export function computeCourierWorkload(letters: Letter[]) {
  const counts = new Map<string, number>();
  letters.forEach((letter) => {
    if (!letter.courier) return;
    const name = letter.courier.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return {
    labels: Array.from(counts.keys()),
    data: Array.from(counts.values()),
  };
}

export interface CourierQueue {
  /** Assigned but not yet picked up - the courier's next physical task. */
  toPickUp: Letter[];
  /** Picked up and out for delivery right now. */
  inTransit: Letter[];
  /** Everything already settled (delivered or failed), newest first. */
  completed: Letter[];
  /** Assigned + In_Transit, i.e. everything still owed. Sorted so High
   *  priority floats to the top and in-transit work outranks
   *  not-yet-collected work, which is the order a rider actually wants
   *  to see: finish what you're carrying, then collect the next batch. */
  active: Letter[];
  deliveredToday: number;
}

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function isSameDay(iso: string | null, reference: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toDateString() === reference.toDateString();
}

/**
 * Splits a courier's own letters into the working buckets their
 * dashboard and delivery list are built from.
 *
 * Safe to run on the raw GET /letters response *because* the API
 * already self-filters to the requesting courier's assignments when
 * `req.user.role === "Courier"` (see get_letters in
 * Server/src/controllers/letter.controller.js) - there is no client-side
 * courierId filter here, and adding one would be duplicating a rule the
 * server already owns. Do not reuse this for an Admin view without
 * filtering by courier first.
 */
export function computeCourierQueue(letters: Letter[]): CourierQueue {
  const today = new Date();
  const toPickUp = letters.filter((letter) => letter.status === 'Assigned');
  const inTransit = letters.filter((letter) => letter.status === 'In_Transit');

  const completed = letters
    .filter((letter) => letter.status === 'Delivered' || letter.status === 'Undelivered')
    .sort(
      (a, b) =>
        new Date(b.deliveredAt ?? b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.deliveredAt ?? a.updatedAt ?? a.createdAt).getTime()
    );

  const active = [...inTransit, ...toPickUp].sort((a, b) => {
    // In_Transit before Assigned regardless of priority - a letter
    // already in the rider's bag is the more urgent commitment.
    if (a.status !== b.status) return a.status === 'In_Transit' ? -1 : 1;
    return (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
  });

  return {
    toPickUp,
    inTransit,
    completed,
    active,
    deliveredToday: letters.filter(
      (letter) => letter.status === 'Delivered' && isSameDay(letter.deliveredAt, today)
    ).length,
  };
}

/** Counts letters per sender directorate - used for the Admin
 *  dashboard's "letters by directorate" doughnut chart. */
export function computeDirectorateBreakdown(letters: Letter[]) {
  const counts = new Map<string, number>();
  letters.forEach((letter) => {
    const name = letter.senderDirectorate?.name ?? 'Unknown';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });
  return {
    labels: Array.from(counts.keys()),
    data: Array.from(counts.values()),
  };
}

export interface DirectoratePerformance {
  id: string;
  name: string;
  code: string;
  total: number;
  delivered: number;
  inProgress: number;
  undelivered: number;
  deliveryRate: number;
}

/** Groups letters by sender directorate and computes the same
 *  per-directorate breakdown the PHP app's admin dashboard table
 *  showed (total/delivered/in-progress/undelivered/rate). Delivery
 *  rate is delivered / (delivered + undelivered) - letters still in
 *  flight don't count against the rate either way, same as the PHP
 *  app's calculation. */
export function computeDirectoratePerformance(letters: Letter[]): DirectoratePerformance[] {
  const byDirectorate = new Map<string, DirectoratePerformance>();

  letters.forEach((letter) => {
    const dir = letter.senderDirectorate;
    if (!dir) return;

    let entry = byDirectorate.get(dir.id);
    if (!entry) {
      entry = { id: dir.id, name: dir.name, code: dir.code, total: 0, delivered: 0, inProgress: 0, undelivered: 0, deliveryRate: 0 };
      byDirectorate.set(dir.id, entry);
    }

    entry.total += 1;
    if (letter.status === 'Delivered') entry.delivered += 1;
    else if (letter.status === 'Undelivered') entry.undelivered += 1;
    else if (IN_PROGRESS_STATUSES.has(letter.status)) entry.inProgress += 1;
  });

  return Array.from(byDirectorate.values()).map((entry) => {
    const settled = entry.delivered + entry.undelivered;
    return { ...entry, deliveryRate: settled > 0 ? Math.round((entry.delivered / settled) * 100) : 0 };
  });
}
