"use client";

import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import RoleCard from "@/components/RoleCard";

type PetKey = "dog" | "cat" | "rabbit";

const FRONT_IMAGE_BY_PET: Record<PetKey, string> = {
  dog: "/images/card-front-dog.jpg",
  cat: "/images/card-front-cat.jpg",
  rabbit: "/images/card-front-rabbit.jpg",
};

type Props = {
  species: PetKey;
  // MVP（直前に選ばれた役割）
  mvpRole: string;
  mvpComment: string;
  // ラスボス
  bossRole: string;
  bossComment: string;
  /** アニメ完了後（VS画面へ進めたいタイミングで呼ばれる） */
  onDone: () => void;
};

/**
 * MVP→ラスボス登場の導入アニメ
 *
 * 構成：
 * 1) MVPカードを中央表示
 * 2) MVPカードが縮小退場
 * 3) カード裏面(card-back.jpg)が下から出現＆“もくもく”煙
 * 4) 裏面カードが2軸回転（X/Y）
 * 5) 白フラッシュ
 * 6) ボス表面カード（speciesごとのfront画像＋役割/コメント）をボイン表示
 * 7) onDone() を呼んで終了
 */
export default function BossIntro({
  species,
  mvpRole,
  mvpComment,
  bossRole,
  bossComment,
  onDone,
}: Props) {
  const mvpCtrl = useAnimation();
  const backCtrl = useAnimation();
  const bossCtrl = useAnimation();
  const flashCtrl = useAnimation();
  const smokeCtrlL = useAnimation();
  const smokeCtrlR = useAnimation();

  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) MVPカード：入場
      await mvpCtrl.start({
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.5, ease: "easeOut" },
      });

      // 小休止
      await wait(300);

      // 2) MVPカード：縮小退場（奥へ）
      await mvpCtrl.start({
        opacity: 0,
        scale: 0.55,
        y: -20,
        filter: "blur(2px)",
        transition: { duration: 0.45, ease: "easeIn" },
      });

      // 3) カード裏面：下から出現（軽くバウンス）
      backCtrl.set({ opacity: 0, y: 80, rotateX: 0, rotateY: 0, scale: 0.92 });
      smokeCtrlL.set({ opacity: 0, y: 40, scale: 0.9 });
      smokeCtrlR.set({ opacity: 0, y: 40, scale: 0.9 });

      await Promise.all([
        backCtrl.start({
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] },
        }),
        smokeCtrlL.start({
          opacity: 0.75,
          y: -10,
          scale: 1.05,
          transition: { duration: 0.55, ease: "easeOut" },
        }),
        smokeCtrlR.start({
          opacity: 0.75,
          y: -10,
          scale: 1.05,
          transition: { duration: 0.55, ease: "easeOut" },
        }),
      ]);

      // 4) 裏面：2軸回転（くるくる）
      await backCtrl.start({
        rotateX: [0, 18, -14, 0],
        rotateY: [0, -22, 16, 0],
        transition: { duration: 0.9, ease: "easeInOut" },
      });

      // もくもく継続モーション（並行で軽く上昇＆拡散）
      smokeCtrlL.start({
        opacity: [0.75, 0.6, 0.4],
        y: [-10, -26, -40],
        scale: [1.05, 1.15, 1.25],
        transition: { duration: 1.1, ease: "easeOut" },
      });
      smokeCtrlR.start({
        opacity: [0.75, 0.6, 0.4],
        y: [-10, -26, -40],
        scale: [1.05, 1.15, 1.25],
        transition: { duration: 1.1, ease: "easeOut" },
      });

      // 5) 白フラッシュ → 6) ボス表面に切り替え（ボイン）
      flashCtrl.set({ opacity: 0 });
      bossCtrl.set({ opacity: 0, scale: 0.92, rotate: 0 });

      await Promise.all([
        // フラッシュ
        flashCtrl.start({
          opacity: [0, 1, 0],
          transition: { times: [0, 0.5, 1], duration: 0.35, ease: "easeInOut" },
        }),
        // 裏面は薄くフェードアウト
        backCtrl.start({
          opacity: 0.0,
          transition: { duration: 0.35, ease: "linear" },
        }),
      ]);

      await bossCtrl.start({
        opacity: 1,
        scale: [0.92, 1.04, 1],
        transition: { duration: 0.45, ease: "easeOut" },
      });

      // 少し見せて…
      await wait(600);

      if (mounted) onDone();
    })();

    return () => {
      mounted = false;
    };
  }, [mvpCtrl, backCtrl, bossCtrl, flashCtrl, smokeCtrlL, smokeCtrlR, onDone]);

  const bossFrontSrc = FRONT_IMAGE_BY_PET[species];

  return (
    <div className="relative mx-auto flex h-[70vh] w-full max-w-4xl items-center justify-center">
      {/* 背景のうっすらグラデ */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

      {/* もくもく（左右） */}
      <motion.div
        className="absolute bottom-20 left-6 h-40 w-40 rounded-full bg-white/70 blur-3xl"
        animate={smokeCtrlL}
        style={{ mixBlendMode: "screen" }}
      />
      <motion.div
        className="absolute bottom-16 right-6 h-44 w-44 rounded-full bg-white/70 blur-3xl"
        animate={smokeCtrlR}
        style={{ mixBlendMode: "screen" }}
      />

      {/* 1) MVPカード */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, filter: "blur(2px)" }}
        animate={mvpCtrl}
        className="relative z-10"
      >
        <RoleCard species={species} role={mvpRole} comment={mvpComment} variant="battle" />
        <div className="mt-2 text-center text-white text-sm opacity-80">あなたのMVP</div>
      </motion.div>

      {/* 3) 裏面カード（card-back.jpg） */}
      <motion.div
        animate={backCtrl}
        className="absolute z-10"
        style={{ willChange: "transform, opacity" }}
      >
        <img
          src="/images/card-back.jpg"
          alt="card back"
          className="h-[360px] w-[240px] select-none rounded-xl shadow-2xl"
          draggable={false}
        />
      </motion.div>

      {/* 5) 白フラッシュ */}
      <motion.div
        animate={flashCtrl}
        className="pointer-events-none absolute inset-0 z-20 bg-white"
        style={{ opacity: 0 }}
      />

      {/* 6) ボスカード（表） */}
      <motion.div
        animate={bossCtrl}
        className="absolute z-10"
        style={{ willChange: "transform, opacity" }}
      >
        <RoleCard
          species={species}
          role={bossRole}
          comment={bossComment}
          // 表面画像は RoleCard 内の仕様に準拠（speciesで出し分け）
          variant="battle"
          // もしRoleCardがspecies依存で自動切替しない場合は、下のimgを使って差し替えてください
          // frontSrc={bossFrontSrc}
        />
      </motion.div>

      {/* 補助スタイル（もくもくの微揺れ） */}
      <style jsx>{`
        @keyframes wobble {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-4px) translateX(2px); }
        }
        .wobble { animation: wobble 2.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
