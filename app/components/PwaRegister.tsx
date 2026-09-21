"use client";

import { useEffect } from "react";

/** Registers the service worker as soon as this mounts. Renders nothing.
 *
 * Previously this waited for the window's `load` event, which only ever
 * fires once per page load — a component that mounts after `load` has
 * already fired (a slow connection, or the SW having been wiped by a site
 * permission/data reset without a hard reload) would never register,
 * leaving `navigator.serviceWorker.ready` in PushToggle with nothing to
 * resolve against ("no active service worker"). Registering immediately is
 * safe: it's async and non-blocking, and register() is a no-op if an
 * identical worker is already registered. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("service worker registration failed", err);
    });
  }, []);

  return null;
}
