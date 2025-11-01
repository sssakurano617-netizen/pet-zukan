// app/components/BattlePair.tsx
"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import RoleCard from "@/components/RoleCard";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());

type ServerPet = {
  id: number;
  species: string;
  name?: string;
  role: string;
  comment: string;
};

const JP2KEY: Record<string, "dog" | "cat" | "rabbit" | undefined> = {
  "犬": "dog",
  "猫": "cat",
  "うさぎ": "rabbit",
};

const TOTAL_ROUNDS = 3;

// 種別ごとの「ラスボス専用」役割
function bossRoleFor(species: "dog" | "cat" | "rabbit") {
  return species === "cat" ? "潜在意識圏の監視" : "発生リハビリ";
}

const petKey = (p: Pick<ServerPet, "role" | "comment">) =>
  `${(p.role ?? "").trim()}｜${(p.comment ?? "").trim()}`;

function equalsPair<T>(a: [T, T], b: [T, T]) {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}

function sampleTwo<T>(arr: T[], prev?: [T, T] | null): [T, T] {
  if (arr.length < 2) throw new Error("候補が2件未満です。図鑑に役割を追加してください。");
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * (arr.length - 1));
  if (j >= i) j += 1;
  const next: [T, T] = [arr[i], arr[j]];
  let retry = 0;
  while (prev && equalsPair(prev, next) && retry < 5) {
    retry++;
    return sampleTwo(arr, prev);
  }
  return next;
}

type Selection = {
  round: number;
  chosen: "left" | "right";
  role: string;
  comment: string;
};

export default function BattlePair({ species }: { species: "dog" | "cat" | "rabbit" }) {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<ServerPet[]>("/api/pets", fetcher);

  // ラスボス専用ワード（この種ではラウンド1〜3から除外）
  const bossOnly = bossRoleFor(species);

  // ラウンド用候補（種一致 & テキスト有り & ラスボス専用を除外）
  const candidates = useMemo(() => {
    if (!data) return [];
    return data.filter(p => {
      const key = JP2KEY[p.species] ?? (p.species as any);
      const role = (p.role ?? "").trim();
      const comment = (p.comment ?? "").trim();
      return key === species && role && comment && role !== bossOnly;
    });
  }, [data, species, bossOnly]);

  const [pair, setPair] = useState<[ServerPet, ServerPet] | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<Selection[]>([]);
  const [finished, setFinished] = useState(false);

  const [pendingChoice, setPendingChoice] = useState<"left" | "right" | null>(null);

  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [finalPick, setFinalPick] = useState<Selection | null>(null);

  // これまでに「選ばれたカード」のキー（次ラウンドで再出現させない）
  const [chosenKeys, setChosenKeys] = useState<Set<string>>(new Set());

  // 初期ペア
  useMemo(() => {
    if (!pair && candidates.length >= 2) setPair(sampleTwo(candidates, null));
  }, [pair, candidates]);

  function handleChoose(side: "left" | "right") {
    setPendingChoice(side);
  }

  function commitRoundChoice() {
    if (!pair || !pendingChoice) return;
    const picked = pendingChoice === "left" ? pair[0] : pair[1];
    const entry: Selection = { round, chosen: pendingChoice, role: picked.role, comment: picked.comment };
    const pickedKey = petKey(picked);

    // 履歴に追加
    setHistory(prev => [...prev, entry]);

    // 次ラウンド用に「選ばれたカード」を除外対象へ
    const nextChosenKeys = new Set(chosenKeys);
    nextChosenKeys.add(pickedKey);
    setChosenKeys(nextChosenKeys);

    if (round >= TOTAL_ROUNDS) {
      setFinished(true);
    } else {
      // 次のペアを、これまで「選ばれたカード」を除いたプールから抽選
      const pool = candidates.filter(c => !nextChosenKeys.has(petKey(c)));
      const nextPair =
        pool.length >= 2 ? sampleTwo(pool, pair) : sampleTwo(candidates, pair); // 念のためフォールバック
      setRound(r => r + 1);
      setPair(nextPair);
    }
    setPendingChoice(null);
  }

  function confirmFinalPick() {
    if (selectedRound == null) return;
    const pick = history.find(h => h.round === selectedRound) || null;
    if (!pick) return;
    setFinalPick(pick);

    const role = encodeURIComponent(pick.role);
    const comment = encodeURIComponent(pick.comment);
    router.push(`/role-battle/${species}/boss?role=${role}&comment=${comment}`);
  }

  // ラウンド1〜3で「実際に選ばれた3枚」を順番に並べる
  const finalChoices = useMemo(() => {
    const byRound: Selection[] = [];
    for (let r = 1; r <= TOTAL_ROUNDS; r++) {
      const hit = history.find(h => h.round === r);
      if (hit) byRound.push(hit);
    }
    return byRound;
  }, [history]);

  if (error) return <div className="text-white">読み込みエラー</div>;
  if (isLoading) return <div className="text-white">読み込み中…</div>;
  if (candidates.length < 2) {
    return <div className="text-white">同じ種類の役割が2件以上必要です。図鑑に追加してください。</div>;
  }

  if (!pair && !finished) {
    return <div className="text-white">準備中…</div>;
  }

  return (
    <div className="w-full grid gap-4 grid-rows-[auto_580px_120px] md:grid-rows-[auto_600px_120px] justify-items-center">
      {/* ヘッダー */}
      <div className="w-full -mb-2 flex items-center justify-between text-white/90">
        <div className="text-sm">ラウンド <b>{Math.min(round, TOTAL_ROUNDS)}</b> / {TOTAL_ROUNDS}</div>
        <button
          className="rounded-lg border border-white/30 px-3 py-1 text-xs hover:bg-white/10"
          onClick={() => {
            setRound(1);
            setHistory([]);
            setFinished(false);
            setPendingChoice(null);
            setSelectedRound(null);
            setFinalPick(null);
            setPair(sampleTwo(candidates, null));
            setChosenKeys(new Set());
          }}
        >
          最初からやり直す
        </button>
      </div>

      {/* 上段：対決 or MVP三択 */}
      <div className="h-[580px] md:h-[600px] w-full flex items-center justify-center relative">
        {!finished ? (
          // ラウンド1〜3
          <div className="flex items-center justify-center gap-8 md:gap-10">
            {/* 左側 */}
            <div className="flex flex-col items-center gap-3">
              <RoleCard species={species} role={pair![0].role} comment={pair![0].comment} variant="battle" />
              <button
                className={[
                  "rounded-xl px-8 py-4 text-lg md:px-10 md:py-5 md:text-xl min-w-[140px] font-bold active:translate-y-px transition-colors duration-200",
                  pendingChoice === "left" ? "bg-sky-500 text-white" : "bg-amber-400 hover:brightness-110 text-black",
                ].join(" ")}
                onClick={() => handleChoose("left")}
              >
                こっち
              </button>
            </div>

            <div className="text-white text-4xl md:text-6xl font-extrabold select-none">VS</div>

            {/* 右側 */}
            <div className="flex flex-col items-center gap-3">
              <RoleCard species={species} role={pair![1].role} comment={pair![1].comment} variant="battle" />
              <button
                className={[
                  "rounded-xl px-8 py-4 text-lg md:px-10 md:py-5 md:text-xl min-w-[140px] font-bold active:translate-y-px transition-colors duration-200",
                  pendingChoice === "right" ? "bg-sky-500 text-white" : "bg-amber-400 hover:brightness-110 text-black",
                ].join(" ")}
                onClick={() => handleChoose("right")}
              >
                こっち
              </button>
            </div>
          </div>
        ) : (
          // MVP 三択（ラウンド1〜3で選ばれた3枚）
          <div className="flex flex-col items-center gap-6">
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold">最後に：一番おもしろい役割を1つ選んでください</h2>
              <p className="opacity-80 text-sm mt-1">下の3枚から 1 つタップ → 下のボタンで決定</p>
            </div>

            <div className="flex items-start justify-center gap-6 md:gap-10">
              {finalChoices.map((h) => {
                const isSelected = selectedRound === h.round;
                return (
                  <button
                    type="button"
                    key={h.round}
                    onClick={() => setSelectedRound(h.round)}
                    className={[
                      "rounded-2xl transition shadow-lg focus:outline-none",
                      isSelected ? "ring-4 ring-sky-400 scale-105" : "ring-0 hover:scale-105",
                    ].join(" ")}
                  >
                    <RoleCard
                      species={species}
                      role={h.role}
                      comment={h.comment}
                      size="md"
                      variant="final"
                      className="pointer-events-none"
                      contentOffsetY={30}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 下段：フッターボタン */}
      <div className="h-[120px] w-full flex items-center justify-center">
        {!finished ? (
          round < TOTAL_ROUNDS ? (
            <button
              className={[
                "rounded-full px-6 py-3 text-white disabled:opacity-40 disabled:cursor-not-allowed",
                pendingChoice ? "bg-sky-500 hover:brightness-110" : "bg-slate-500",
              ].join(" ")}
              onClick={commitRoundChoice}
              disabled={!pendingChoice}
            >
              {round === 1 ? "round2へ" : "round3へ"}
            </button>
          ) : (
            <button
              className={[
                "rounded-full px-6 py-3 text-white disabled:opacity-40 disabled:cursor-not-allowed",
                pendingChoice ? "bg-sky-500 hover:brightness-110" : "bg-slate-500",
              ].join(" ")}
              onClick={commitRoundChoice}
              disabled={!pendingChoice}
            >
              MVPを決める
            </button>
          )
        ) : (
          <button
            className="rounded-full bg-white/15 px-6 py-3 text-white hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={confirmFinalPick}
            disabled={selectedRound == null}
          >
            これにする
          </button>
        )}
      </div>
    </div>
  );
}
