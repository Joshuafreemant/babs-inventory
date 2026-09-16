"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiPost, apiDelete } from "../../lib/api";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Self-service "order alerts on this device" toggle — every signed-in staff
 * member (rep or admin) can turn this on for their own browser. Separate
 * from the admin-managed SMS/email recipient list in Settings. Defaults to
 * "on": the first time a device has never been asked, it tries to subscribe
 * automatically instead of waiting for a click — a browser can't grant
 * notification permission without asking, so this is as close to on-by-
 * default as the platform allows. */
export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were blocked — allow them in your browser settings to enable alerts.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });
      const json = sub.toJSON();
      await apiPost("/api/staff/push/subscribe", {
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent,
      });
      setSubscribed(true);
      toast.success("Order alerts enabled on this device");
    } catch (e: any) {
      toast.error(e.message || "Could not enable notifications");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(!!sub);
        // never asked on this device yet — try to turn it on right away
        // instead of waiting for the button to be noticed and clicked
        if (!sub && !autoTried.current && Notification.permission === "default") {
          autoTried.current = true;
          enable();
        }
      })
      .catch(() => {});
  }, [enable]);

  if (!supported) return null;

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiDelete("/api/staff/push/subscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast("Order alerts turned off on this device");
    } catch (e: any) {
      toast.error(e.message || "Could not disable notifications");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-sm ${subscribed ? "btn-outline" : "btn-primary"}`}
      disabled={busy}
      onClick={subscribed ? disable : enable}
    >
      {busy ? "…" : subscribed ? "🔔 Order alerts on" : "🔕 Enable order alerts"}
    </button>
  );
}
