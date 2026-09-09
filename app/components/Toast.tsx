"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Centred navy toast matching the prototype. Returns [node, show()]. */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = msg ? <div className="toast">{msg}</div> : null;
  return [node, show];
}
