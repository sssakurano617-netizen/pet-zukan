"use client";

import { useEffect, useRef } from "react";

const POLL_MS = 250;

export default function PawWatcher() {
  const ticking = useRef(false);

  useEffect(() => {
    const id = setInterval(async () => {
      if (ticking.current) return;
      ticking.current = true;
      try {
        const res = await fetch("/api/paw", { cache: "no-store" });
        const data = await res.json();
        if (data?.detected) {
          // 1) 各ページに通知（どのページでも受け取れる）
          window.dispatchEvent(
            new CustomEvent("paw-detected", {
              detail: { at: Date.now(), source: "camera" },
            })
          );
          // 2) フラグを即リセット
          await fetch("/api/paw", { method: "DELETE" });
        }
      } catch {
        /* no-op */
      } finally {
        ticking.current = false;
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return null; // 何も表示しない
}
