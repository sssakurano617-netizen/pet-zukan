"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const SELECTORS = [
  "button",
  "a[href]",
  'input[type="button"]',
  'input[type="submit"]',
  '[role="button"]',
  "[data-click-sound]"
].join(",");

type Ctx = {
  play: () => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
  volume: number; // 0-1
  setVolume: (v: number) => void;
};

const ClickSoundContext = createContext<Ctx | null>(null);
export const useClickSound = () => {
  const ctx = useContext(ClickSoundContext);
  if (!ctx) throw new Error("useClickSound must be used within ClickSoundProvider");
  return ctx;
};

export default function ClickSoundProvider({ children }: { children: React.ReactNode }) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);

  // 1) 最初のユーザー操作でAudioContextを作る（iOS/Safari対策）
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        unlockedRef.current = true;
        console.log("[ClickSound] AudioContext unlocked");
      } catch (e) {
        console.warn("[ClickSound] AudioContext init failed", e);
      }
      window.removeEventListener("pointerdown", unlock, { capture: true } as any);
      window.removeEventListener("keydown", unlock, { capture: true } as any);
      window.removeEventListener("click", unlock, { capture: true } as any);
    };
    // どれか1回で解錠
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });
    window.addEventListener("click", unlock, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true } as any);
      window.removeEventListener("keydown", unlock, { capture: true } as any);
      window.removeEventListener("click", unlock, { capture: true } as any);
    };
  }, []);

  // 2) 実際に音を鳴らす（WebAudioで短い「ピッ」）
  const play = useCallback(() => {
    if (muted) return;
    const ctx = audioCtxRef.current;
    if (!ctx) {
      console.log("[ClickSound] skipped: AudioContext not ready");
      return;
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 軽いクリック音ぽい包絡
    osc.type = "square"; // または "sine" / "triangle"
    osc.frequency.setValueAtTime(180, now);       // 開始周波数
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.05); // 少し上がる

    const v = Math.max(0.0001, Math.min(1, volume));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * v, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }, [muted, volume]);

  // 3) クリック/Enter/Space でインタラクティブ要素を拾って鳴らす
  useEffect(() => {
    const clickHandler = (e: Event) => {
      // @ts-ignore
      if (e.isTrusted === false) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const el = target.closest<HTMLElement>(SELECTORS);
      if (!el) return;

      if ((el as HTMLButtonElement).disabled) return;
      if (el.getAttribute("aria-disabled") === "true") return;

      console.log("[ClickSound] click on", el.tagName, el.getAttribute("href") || el.getAttribute("role") || "");
      play();
    };

    const keyHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (e.key !== "Enter" && e.key !== " ") return;

      const el = target.closest<HTMLElement>(SELECTORS);
      if (!el) return;

      if ((el as HTMLButtonElement).disabled) return;
      if (el.getAttribute("aria-disabled") === "true") return;

      console.log("[ClickSound] key", e.key, "on", el.tagName);
      play();
    };

    window.addEventListener("click", clickHandler, { capture: true });
    window.addEventListener("keydown", keyHandler, { capture: true });

    return () => {
      window.removeEventListener("click", clickHandler, { capture: true } as any);
      window.removeEventListener("keydown", keyHandler, { capture: true } as any);
    };
  }, [play]);

  const value = useMemo(() => ({ play, muted, setMuted, volume, setVolume }), [play, muted, volume]);

  return <ClickSoundContext.Provider value={value}>{children}</ClickSoundContext.Provider>;
}
