"use client";

import { InfiniteList } from "./useInfiniteList";

/** Sentinel + status line for the bottom of an infinite-scroll list. */
export function InfiniteFooter<T>({
  list,
  noun,
  count,
}: {
  list: InfiniteList<T>;
  noun: string;
  count: number;
}) {
  return (
    <div ref={list.sentinelRef} style={{ padding: "12px 18px", textAlign: "center" }}>
      {list.error ? (
        <button
          className="btn btn-sm btn-outline"
          onClick={() => list.loadMore()}
          style={{ fontSize: 11.5 }}
        >
          {list.error} — retry
        </button>
      ) : list.loading ? (
        <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Loading more…</span>
      ) : list.hasMore ? (
        <button
          className="btn btn-sm btn-outline"
          onClick={() => list.loadMore()}
          style={{ fontSize: 11.5 }}
        >
          Load more {noun}
        </button>
      ) : count > 0 ? (
        <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
          All {count} {noun} loaded
        </span>
      ) : null}
    </div>
  );
}
