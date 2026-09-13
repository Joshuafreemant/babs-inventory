"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "../../lib/api";

interface Options<T> {
  endpoint: string;
  /** array field on the response, e.g. "products" | "orders" */
  key: string;
  limit?: number;
  /** runs on every page load — e.g. to pick up `stats` / `total` from the response */
  onPage?: (res: any, isFirst: boolean) => void;
  enabled?: boolean;
}

export interface InfiniteList<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  hasMore: boolean;
  error: string;
  ready: boolean;
  /** attach to a sentinel element rendered right after the list */
  sentinelRef: (node: HTMLElement | null) => void;
  /** force-load the next page (used by the "Load more" button) */
  loadMore: () => void;
  /** clear and refetch from the first page */
  reload: () => void;
}

const TRIGGER_PX = 350;

export function useInfiniteList<T>({
  endpoint,
  key,
  limit = 20,
  onPage,
  enabled = true,
}: Options<T>): InfiniteList<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const hasMoreRef = useRef(true);
  const reloadTick = useRef(0);
  const nodeRef = useRef<HTMLElement | null>(null);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;

  /** how far the sentinel's top is above the bottom of the viewport (negative = below) */
  const sentinelGap = useCallback(() => {
    const n = nodeRef.current;
    if (!n) return Infinity;
    return (window.innerHeight || 0) - n.getBoundingClientRect().top;
  }, []);

  const load = useCallback(async () => {
    if (busyRef.current || !hasMoreRef.current || !enabled) return;
    busyRef.current = true;
    setLoading(true);
    setError("");
    const tick = reloadTick.current;
    try {
      // `endpoint` may already carry its own query string (e.g. filters) —
      // merge into it rather than appending a second "?"
      const [base, existingQs] = endpoint.split("?");
      const q = new URLSearchParams(existingQs || "");
      q.set("limit", String(limit));
      if (cursorRef.current) q.set("cursor", cursorRef.current);
      const res = await apiGet<any>(`${base}?${q.toString()}`);
      if (tick !== reloadTick.current) return;
      const batch: T[] = Array.isArray(res?.[key]) ? res[key] : [];
      const isFirst = cursorRef.current === null;
      setItems((prev) => (isFirst ? batch : [...prev, ...batch]));
      cursorRef.current = res?.nextCursor ?? null;
      hasMoreRef.current = Boolean(res?.hasMore);
      setHasMore(hasMoreRef.current);
      onPageRef.current?.(res, isFirst);
      setReady(true);
    } catch (e: any) {
      setError(e?.message || "Could not load.");
    } finally {
      busyRef.current = false;
      setLoading(false);
      // keep pulling while the sentinel is still in view (tall panel / fast scroll)
      if (hasMoreRef.current && tick === reloadTick.current) {
        requestAnimationFrame(() => {
          if (sentinelGap() > -TRIGGER_PX) load();
        });
      }
    }
  }, [endpoint, key, limit, enabled, sentinelGap]);

  const onScroll = useCallback(() => {
    if (!busyRef.current && hasMoreRef.current && sentinelGap() > -TRIGGER_PX) load();
  }, [load, sentinelGap]);

  const reload = useCallback(() => {
    reloadTick.current += 1;
    cursorRef.current = null;
    hasMoreRef.current = true;
    busyRef.current = false;
    setHasMore(true);
    setReady(false);
    setItems([]);
    load();
  }, [load]);

  useEffect(() => {
    if (enabled) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, endpoint]);

  // listen on the sentinel's nearest scrollable ancestor *and* the window,
  // so it works whether the panel scrolls internally or the page does
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      scrollElRef.current?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      nodeRef.current = node;
      scrollElRef.current = null;
      if (!node) return;

      let el: HTMLElement | null = node.parentElement;
      while (el && el !== document.body) {
        const oy = getComputedStyle(el).overflowY;
        if (oy === "auto" || oy === "scroll") break;
        el = el.parentElement;
      }
      if (el && el !== document.body) {
        scrollElRef.current = el;
        el.addEventListener("scroll", onScroll, { passive: true });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      requestAnimationFrame(onScroll);
    },
    [onScroll]
  );

  useEffect(
    () => () => {
      scrollElRef.current?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    },
    [onScroll]
  );

  return { items, setItems, loading, hasMore, error, ready, sentinelRef, loadMore: load, reload };
}
