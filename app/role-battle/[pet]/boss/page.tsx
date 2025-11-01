// app/role-battle/[pet]/boss/page.tsx
"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import RoleCard from "@/components/RoleCard";

const SUPPORTED = ["dog", "cat", "rabbit"] as const;
type PetKey = (typeof SUPPORTED)[number];

/** エンディング画像（JPG） */
const ENDING_IMAGE_SRC = "/images/ending-image.jpg";

export default function BossPage({
  params,
  searchParams,
}: {
  params: { pet?: string };
  searchParams?: { role?: string; comment?: string };
}) {
  const pet = params.pet as PetKey | undefined;
  if (!pet || !SUPPORTED.includes(pet)) notFound();

  // ★ ペットごとのラスボス文言
  const bossRole = pet === "cat" ? "潜在意識圏の監視" : "発生リハビリ";
  const bossComment =
    pet === "cat"
      ? "考えすぎている時は妙に距離をとって寝る。逆に身体的に疲れているとピタッとくっついてくるので、行動というより位置感覚で見守られている気がする。"
      : "毎日「ありがとう」と声に出して伝える。声を出す習慣が、気持ちと生活のリズムを整えてくれる。";

  // ===== MVP（選ばれたカード）をクエリから復元 =====
  const mvpRole =
    (searchParams?.role ? decodeURIComponent(searchParams.role) : "").trim() ||
    "（役割未設定）";
  const mvpComment =
    (searchParams?.comment ? decodeURIComponent(searchParams.comment) : "").trim() ||
    "（コメント未設定）";

  // 段階制御アニメーション
  const mvpControls = useAnimation();
  const dropControls = useAnimation();
  const spinControls = useAnimation();
  const cloudControls = useAnimation();
  const bossFinalControls = useAnimation();

  // 状態
  const [finalStage, setFinalStage] = useState(false);
  const [selected, setSelected] = useState<"mvp" | "boss" | null>(null);
  const [winner, setWinner] = useState<"mvp" | "boss" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showEndingImage, setShowEndingImage] = useState(false); // 5秒後に画像を出す
  const [endingLoaded, setEndingLoaded] = useState(false);       // 画像読み込み完了

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // 結果コピー
  const getResultCopy = (kind: "mvp" | "boss") =>
    kind === "boss"
      ? {
          title: "君は王道ガチ派！",
          body: `みんなの“ド本命”とドンピシャ一致。『${bossRole}』で世界を整える側だ。`,
        }
      : {
          title: "君は少数精鋭の切り込み隊長！",
          body: `刺さる人にドン刺さり。『${mvpRole}』推し、その選球眼…キレッキレ！`,
        };

  // 結果が出たら 5 秒後にエンディング画像
  useEffect(() => {
    if (!showResult) {
      setShowEndingImage(false);
      setEndingLoaded(false);
      return;
    }
    const t2 = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        setEndingLoaded(true);
        setShowEndingImage(true);
      };
      img.onerror = () => {
        setEndingLoaded(false);
        setShowEndingImage(true);
      };
      img.src = ENDING_IMAGE_SRC;
    }, 5000);

    return () => clearTimeout(t2);
  }, [showResult]);

  // ===== ラスボス 演出（降下→左右→回転→余韻） =====
  useEffect(() => {
    let mounted = true;

    async function run() {
      await mvpControls.start({ scale: 0.86, transition: { duration: 0.5, ease: "easeOut" } });

      cloudControls.start({
        opacity: [0, 1, 0.75, 0.6],
        scale: [0.9, 1.1, 1.2, 1.25],
        transition: { duration: 1.6, ease: "easeOut" },
      });
      await dropControls.start({ y: 0, opacity: 1, transition: { duration: 0.9, ease: "easeOut" } });

      cloudControls.start({
        opacity: [0.6, 0.95, 0.8, 0.95, 0.8, 0.95, 0.5],
        scale: [1.25, 1.36, 1.32, 1.4, 1.34, 1.44, 1.38],
        transition: { duration: 1.8, ease: "easeInOut" },
      });
      await dropControls.start({
        x: [0, 120, -120, 120, -120, 120, 0],
        transition: { duration: 1.8, ease: "easeInOut" },
      });

      await spinControls.start({
        rotateY: [
          180, -720, -1440, -2160, -2880, -3240, -3420, -3510, -3560, -3585, -3600,
        ],
        transition: {
          duration: 3.4,
          ease: "linear",
          times: [0, 0.06, 0.12, 0.19, 0.32, 0.55, 0.72, 0.84, 0.92, 0.975, 1],
        },
      });
      spinControls.set({ rotateY: 0 });

      await cloudControls.start({ opacity: [0.5, 0.25, 0], transition: { duration: 0.7, ease: "easeOut" } });

      if (!mounted) return;
      await mvpControls.start({ opacity: 0, transition: { duration: 0.35 } });
      await sleep(1000);
      if (!mounted) return;
      setFinalStage(true);
    }

    // 初期位置
    dropControls.set({ y: -520, opacity: 0, scale: 1.24, x: 0 });
    spinControls.set({ rotateY: 180 });

    run();
    return () => {
      mounted = false;
    };
  }, [cloudControls, dropControls, mvpControls, spinControls]);

  // ===== ヘルパー（クラッカー / 勝者脈動 / 退場） =====
  async function fireConfetti(kind: "mvp" | "boss") {
    const mod = await import("canvas-confetti");
    const confetti = (mod.default ?? (mod as any)) as (opts?: any) => void;

    confetti({ particleCount: 120, spread: 70, startVelocity: 55, origin: { x: 0.5, y: 0.5 }, ticks: 160, scalar: 1 });

    const left = { x: 0.15, y: 0.7 }, right = { x: 0.85, y: 0.7 };
    const strong = kind === "mvp" ? left : right, weak = kind === "mvp" ? right : left;

    confetti({ particleCount: 80, angle: 60,  spread: 55, origin: strong, startVelocity: 52, scalar: 0.9 });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: weak,   startVelocity: 45, scalar: 0.8 });
    setTimeout(() => confetti({ particleCount: 40, spread: 80, origin: { x: 0.5, y: 0.4 }, scalar: 0.9 }), 180);
    setTimeout(() => confetti({ particleCount: 30, spread: 70, origin: strong, scalar: 0.8 }), 320);
  }

  function pulseWinner(kind: "mvp" | "boss") {
    const ctrl = kind === "mvp" ? mvpControls : bossFinalControls;
    ctrl.start({
      scale: [1.85, 1.97, 1.85, 1.93, 1.85],
      transition: { duration: 0.9, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" },
    });
  }

  async function exitToBackground(kind: "mvp" | "boss") {
    const winCtrl  = kind === "mvp" ? mvpControls : bossFinalControls;
    const loseCtrl = kind === "mvp" ? bossFinalControls : mvpControls;

    await Promise.all([
      winCtrl.start({
        x: [0, 10, -8, 6, -4, 0],
        rotateZ: [0, 1, -1, 1, -1, 0],
        y: [0, -6, -10, -18, -26, -34],
        scale: [1.85, 1.6, 1.2, 0.8, 0.45, 0.2],
        opacity: [1, 1, 0.9, 0.7, 0.45, 0],
        filter: ["blur(0px)", "blur(1px)", "blur(2px)", "blur(4px)", "blur(6px)", "blur(8px)"],
        transition: { duration: 1.2, ease: "easeIn" },
      }),
      loseCtrl.start({
        rotateZ: [0, -1, 1, -1, 1, 0],
        y: [0, -4, -8, -12, -18, -24],
        scale: [0.74, 0.6, 0.45, 0.3, 0.18, 0.1],
        opacity: [0.9, 0.8, 0.6, 0.4, 0.25, 0],
        filter: ["blur(0px)", "blur(1px)", "blur(2px)", "blur(4px)", "blur(6px)", "blur(8px)"],
        transition: { duration: 1.2, ease: "easeIn" },
      }),
    ]);
  }

  // ===== 選択（クリック） =====
  // 拡大はしない。選択状態は青い枠で表現（MVP三択と同じUX）
  async function handleSelect(kind: "mvp" | "boss") {
    if (winner) return;
    setSelected(kind);
    // ※ 選択時の拡大アニメーションは無し
  }

  // ===== 「一番はこれだ！」 =====
  async function handleConfirm() {
    if (!selected || winner) return;
    setWinner(selected);

    // 勝者確定アニメーションは従来どおり（ここは演出として拡大）
    if (selected === "mvp") {
      await Promise.all([
        mvpControls.start({  scale: 1.85, x: 0,   transition: { type: "spring", stiffness: 300, damping: 18 } }),
        bossFinalControls.start({ scale: 0.6,  x: 360, opacity: 0.75, transition: { type: "spring", stiffness: 220, damping: 22 } }),
      ]);
    } else {
      await Promise.all([
        bossFinalControls.start({ scale: 1.85, x: 0,   transition: { type: "spring", stiffness: 300, damping: 18 } }),
        mvpControls.start({        scale: 0.6,  x: -360, opacity: 0.75, transition: { type: "spring", stiffness: 220, damping: 22 } }),
      ]);
    }

    pulseWinner(selected);
    fireConfetti(selected);

    await sleep(5000);            // 勝者を5秒見せる
    await exitToBackground(selected); // 背景へ退場
    await sleep(1500);            // 退場後に結果発表
    setShowResult(true);
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center bg-neutral-900 text-white overflow-hidden">
      {/* === 最終対決に入る前の演出 === */}
      {!finalStage && (
        <>
          {/* 背景のもくもく（左右） */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
            initial={{ opacity: 0, scale: 1 }}
            animate={cloudControls}
          >
            <div className="absolute bottom-16 left-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-28 left-16 h-56 w-56 rounded-full bg-white/12 blur-3xl" />
            <div className="absolute bottom-12 left-44 h-44 w-44 rounded-full bg-white/14 blur-3xl" />
          </motion.div>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
            initial={{ opacity: 0, scale: 1 }}
            animate={cloudControls}
          >
            <div className="absolute bottom-16 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-28 right-16 h-56 w-56 rounded-full bg-white/12 blur-3xl" />
            <div className="absolute bottom-12 right-44 h-44 w-44 rounded-full bg-white/14 blur-3xl" />
          </motion.div>

          {/* MVPカード（上部） */}
          <motion.div
            aria-label="MVPパネル"
            className="absolute top-12 left-1/2 -translate-x-1/2"
            initial={{ scale: 1, opacity: 1 }}
            animate={mvpControls}
          >
            <RoleCard species={pet} role={mvpRole} comment={mvpComment} size="sm" variant="final" className="pointer-events-none" />
          </motion.div>

          {/* ラスボス（降下→ゆらゆら→回転） */}
          <motion.div
            aria-label="ラスボス_外側(位置)"
            className="relative"
            initial={{ y: -520, opacity: 0, scale: 1.24 }}
            animate={dropControls}
            style={{ perspective: "1200px" }}
          >
            <motion.div
              aria-label="ラスボス_内側(Y回転)"
              initial={{ rotateY: 180 }}
              animate={spinControls}
              style={{ transformStyle: "preserve-3d" }}
              className="relative"
            >
              {/* 表面 */}
              <motion.div className="relative" style={{ backfaceVisibility: "hidden" }}>
                <RoleCard species={pet} role={bossRole} comment={bossComment} variant="battle" />
              </motion.div>
              {/* 裏面 */}
              <motion.div className="absolute inset-0" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                <div
                  className="h-full w-full rounded-2xl ring-2 ring-white/25 shadow-[inset_0_0_80px_rgba(0,0,0,0.45)]"
                  style={{ backgroundImage: `url(/images/card-back.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* === 最終対決 UI === */}
      {finalStage && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto" style={{ perspective: "1200px" }}>
          <h2 className="text-4xl font-bold mb-6">🔥 最終対決 🔥</h2>

          <div className="flex items-end gap-8">
            {/* MVP（左） — 選択で青い枠 */}
            <motion.div
              role="button"
              onClick={() => handleSelect("mvp")}
              animate={mvpControls}
              className={[
                "cursor-pointer rounded-2xl transition shadow-lg focus:outline-none",
                selected === "mvp" ? "ring-4 ring-sky-400" : "ring-0 hover:scale-[1.02]",
              ].join(" ")}
            >
              <RoleCard species={pet} role={mvpRole} comment={mvpComment} variant="battle" />
            </motion.div>

            {/* VS */}
            <div className="text-2xl font-semibold opacity-90 select-none">VS</div>

            {/* Boss（右） — 選択で青い枠 */}
            <motion.div
              role="button"
              onClick={() => handleSelect("boss")}
              animate={bossFinalControls}
              className={[
                "cursor-pointer rounded-2xl transition shadow-lg focus:outline-none",
                selected === "boss" ? "ring-4 ring-sky-400" : "ring-0 hover:scale-[1.02]",
              ].join(" ")}
            >
              <RoleCard species={pet} role={bossRole} comment={bossComment} variant="battle" />
            </motion.div>
          </div>

          {/* ボタン / メッセージ */}
          <div className="mt-8 flex flex-col items-center gap-4">
            {!selected && !winner && (
              <motion.p
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="text-xl font-medium text-amber-300"
              >
                あなたの1番を選べ！（カードをクリック）
              </motion.p>
            )}

            {selected && !winner && (
              <button
                onClick={handleConfirm}
                className="rounded-xl bg-amber-400 px-6 py-3 text-neutral-900 font-bold shadow-lg hover:brightness-95 active:translate-y-[1px] transition"
              >
                一番はこれだ！
              </button>
            )}

            {winner && (
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="text-2xl font-bold text-green-400"
              >
                {winner === "mvp" ? "MVPの勝利！" : "ラスボスの勝利！"}
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* 結果発表オーバーレイ */}
      {showResult && winner && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-4 max-w-2xl text-center"
          >
            <h3 className="text-4xl md:text-5xl font-extrabold mb-3">
              {getResultCopy(winner).title}
            </h3>
            <p className="text-base md:text-lg opacity-90 mb-6">
              {getResultCopy(winner).body}
            </p>
            <div className="text-xs opacity-70">
              {winner === "boss" ? `（ラスボス＝${bossRole} を選択）` : `（MVP＝${mvpRole} を選択）`}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* エンディング画像：結果表示から5秒後（下に2ボタン縦並び） */}
      {showEndingImage && (
        <motion.div
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: endingLoaded ? 1 : 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.img
            src={ENDING_IMAGE_SRC}
            alt="エンディング画像"
            onLoad={() => setEndingLoaded(true)}
            className="max-w-[95vw] max-h-[70vh] object-contain mb-8"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: endingLoaded ? 1 : 0, scale: endingLoaded ? 1 : 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <a
              href="/zukan"
              className="rounded-xl bg-amber-400 px-6 py-3 text-lg font-bold text-neutral-900 shadow-md hover:brightness-95 active:translate-y-[1px] transition text-center"
            >
              図鑑ページを見る
            </a>
            <a
              href="/"
              className="rounded-xl bg-white/20 px-4 py-2 text-base font-semibold text-white shadow-md hover:bg白/30 active:translate-y-[1px] transition text-center"
            >
              ホーム画面に戻る
            </a>
          </div>
        </motion.div>
      )}
    </main>
  );
}
