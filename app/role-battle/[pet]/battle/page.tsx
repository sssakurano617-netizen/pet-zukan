// app/role-battle/[pet]/battle/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BattlePair from "@/components/BattlePair";

const SUPPORTED = ["dog", "cat"] as const;
type PetKey = (typeof SUPPORTED)[number];
type Phase = "cue" | "battle";

export default function BattlePage() {
  const params = useParams<{ pet?: string }>();
  const pet = (params?.pet as PetKey | undefined) ?? undefined;
  if (!pet || !SUPPORTED.includes(pet)) notFound();

  // 効果音（public/sounds/punch-slow2.mp3 に配置）
  const sfx = useMemo(() => {
    const a = new Audio("/sounds/punch-slow2.mp3");
    a.preload = "auto";
    a.volume = 0.9;
    return a;
  }, []);

  const [phase, setPhase] = useState<Phase>("cue");

  useEffect(() => {
    const t = setTimeout(() => setPhase("battle"), 3500);
    return () => clearTimeout(t);
  }, []);

  // iOS/Safari 対策：最初のタップで“無音で”アンロック
  const unlockOnceRef = useRef(false);
  const handlePointerDown = () => {
    if (unlockOnceRef.current) return;
    unlockOnceRef.current = true;
    const prevMuted = sfx.muted;
    const prevVol = sfx.volume;
    sfx.muted = true;
    sfx.volume = 0;
    sfx.currentTime = 0;
    sfx.play().then(() => {
      sfx.pause();
      sfx.currentTime = 0;
      sfx.muted = prevMuted;
      sfx.volume = prevVol;
    }).catch(() => {
      sfx.muted = prevMuted;
      sfx.volume = prevVol;
    });
  };

  return (
    <main
      className="relative min-h-[100svh] overflow-hidden bg-black"
      onPointerDown={handlePointerDown}
    >
      {phase === "battle" && (
        <div className="relative z-0">
          <BattlePair species={pet} />
        </div>
      )}

      <AnimatePresence>
        {phase === "cue" && <CueOverlay key="cue" sfx={sfx} />}
      </AnimatePresence>
    </main>
  );
}

function CueOverlay({ sfx }: { sfx: HTMLAudioElement }) {
  const playedRef = useRef(false);

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* 左から中央へ 0.2秒スライド */}
      <motion.div
        className="relative mx-auto rounded-2xl px-8 py-4 bg-white/95 shadow-2xl 
                   border border-black/10 backdrop-blur text-black"
        style={{ fontFamily: "Rampart One, system-ui, sans-serif", fontWeight: 700 }}
        initial={{ x: "-110%", opacity: 1 }}
        animate={{ x: "0%" }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onAnimationStart={() => {
          if (playedRef.current) return;
          playedRef.current = true;
          // ★ スライド開始から 0.03 秒後に再生
          setTimeout(() => {
            try {
              sfx.currentTime = 0;
              void sfx.play();
            } catch {}
          }, 1);
        }}
      >
        <p className="text-2xl md:text-4xl tracking-wide">面白いのはどっち？</p>
      </motion.div>
    </div>
  );
}
