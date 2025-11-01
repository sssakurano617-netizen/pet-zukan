// app/providers/IdleAutoReload.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** 有効/無効の切り替え（デフォルト: 有効） */
  enabled?: boolean;
  /** 何ミリ秒無操作でリロードするか（デフォルト: 3分） */
  idleMs?: number;
};

export default function IdleAutoReload({
  enabled = true,
  idleMs = 3 * 60 * 1000, // 3分
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const isOkayToReload = () => {
      // 画面が見えていて、オンラインの時だけ
      if (document.visibilityState !== "visible") return false;
      if (typeof navigator !== "undefined" && "onLine" in navigator) {
        if (!navigator.onLine) return false;
      }
      return true;
    };

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = () => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (isOkayToReload()) {
          // ⚠️ 必要ならトップに戻したい場合は location.assign("/") に変更
          location.reload();
        } else {
          // 条件がそろっていない場合は延期
          schedule();
        }
      }, idleMs);
    };

    // ユーザー操作を検知 → タイマーリセット
    const reset = () => schedule();

    // 広めにイベントを拾って「操作あり」を検知
    const opts: AddEventListenerOptions = { passive: true };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "mouseup",
      "pointermove",
      "pointerdown",
      "pointerup",
      "wheel",
      "scroll",
      "keydown",
      "keyup",
      "touchstart",
      "touchmove",
    ];

    events.forEach((ev) => window.addEventListener(ev, reset, opts));
    window.addEventListener("focus", reset, opts);
    document.addEventListener("visibilitychange", reset, opts);

    // 初回起動
    schedule();

    return () => {
      clearTimer();
      events.forEach((ev) => window.removeEventListener(ev, reset, opts));
      window.removeEventListener("focus", reset, opts);
      document.removeEventListener("visibilitychange", reset, opts);
    };
  }, [enabled, idleMs]);

  return null; // UIは出さない
}
