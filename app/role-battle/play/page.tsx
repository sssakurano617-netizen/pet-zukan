// app/role-battle/play/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Role = { key: string; species: string; role: string };
type Pair = { a: Role; b: Role };
type Score = { key: string; exposures: number; wins: number; rate: number; meter: number };

export default function PlayBattle() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [round, setRound] = useState(0);
  const [pickedKeys, setPickedKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [done, setDone] = useState(false);
  const [scores, setScores] = useState<Score[] | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // 初期ロード：公平サンプリングされた3問を取得
  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/match?rounds=3`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { pairs: Pair[] };
        if (!canceled) {
          setPairs(Array.isArray(data?.pairs) ? data.pairs : []);
        }
      } catch {
        if (!canceled) setLoadError("問題の取得に失敗しました。時間をおいて再試行してください。");
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  const current = pairs[round];
  const totalRounds = pairs.length;
  const canShowVoting = !loading && !loadError && !done && current;

  const uniquePicked = useMemo(
    () => Array.from(new Set(pickedKeys)),
    [pickedKeys]
  );

  // 投票処理
  async function vote(winner: string, loser: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vote`, {
        method: "POST",
        body: JSON.stringify({ winner, loser }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const next = round + 1;
      setPickedKeys((prev) => Array.from(new Set([...prev, winner, loser])));

      if (next >= totalRounds) {
        // 終了：今回出た役割のメーター取得
        setDone(true);
        try {
          const sres = await fetch(`/api/score`, {
            method: "POST",
            body: JSON.stringify({
              keys: uniquePicked.length ? uniquePicked : [winner, loser],
            }),
          });
          if (!sres.ok) throw new Error(`HTTP ${sres.status}`);
          const sdata = (await sres.json()) as Score[];
          setScores(sdata || []);
        } catch {
          setScoreError("結果の取得に失敗しました。");
        }
      } else {
        setRound(next);
      }
    } catch {
      alert("投票に失敗しました。ネットワークを確認して再試行してください。");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== UI =====
  if (loading) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-bold mb-3">役割対決</h1>
        <p>問題を読み込み中…</p>
      </main>
    );
  }

  if (loadError || totalRounds === 0) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-bold mb-3">役割対決</h1>
        <p className="mb-4 text-red-600">
          {loadError ?? "問題が用意できませんでした。図鑑に役割が登録されているか確認してください。"}
        </p>
        <div className="flex gap-3">
          <Link href="/role-battle" className="px-4 py-2 rounded border hover:shadow-sm">
            ペット選択へ戻る
          </Link>
          <Link href="/mypage" className="px-4 py-2 rounded border hover:shadow-sm">
            マイページ（役割を登録）
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-bold mb-1">結果（みんなの投票を含む集計）</h1>
        <p className="mb-4 text-sm text-gray-600">
          ※ バーの長さは「珍しさメーター（信頼下限）」、下段に wins / exposures を表示します。
        </p>

        {scoreError && <p className="mb-3 text-red-600">{scoreError}</p>}
        {!scores && !scoreError && <p>集計中…</p>}

        {scores && (
          <ul className="space-y-3">
            {scores
              .slice()
              .sort((a, b) => b.meter - a.meter || b.exposures - a.exposures)
              .map((s) => (
                <li key={s.key} className="border rounded-lg p-3">
                  <div className="mb-1 text-xs text-gray-500 break-all">{s.key}</div>
                  <div className="h-3 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-3 rounded"
                      style={{ width: `${Math.round((s.meter || 0) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    wins {s.wins} / exposures {s.exposures}（信頼下限 {Math.round((s.meter || 0) * 100)}%）
                  </div>
                </li>
              ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/role-battle" className="px-4 py-2 rounded border hover:shadow-sm">
            ペット選択へ戻る
          </Link>
          <Link href="/role-battle/play" className="px-4 py-2 rounded bg-black text-white hover:opacity-90">
            もう一度あそぶ
          </Link>
        </div>
      </main>
    );
  }

  // 出題画面
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-bold mb-2">第 {round + 1} 問 / {totalRounds}</h1>
      <p className="mb-4 text-sm text-gray-600">より「珍しい」と思う方を選んでください（左右は毎回ランダム）。</p>

      {canShowVoting && (
        <div className="space-y-3">
          <button
            className="w-full border rounded-lg p-4 text-left hover:shadow-sm disabled:opacity-60"
            onClick={() => vote(current.a.key, current.b.key)}
            disabled={submitting}
          >
            <div className="text-xs text-gray-500 mb-1">{current.a.species}</div>
            <div className="font-semibold">「{current.a.role}」</div>
          </button>

          <div className="text-center text-sm text-gray-500">vs</div>

          <button
            className="w-full border rounded-lg p-4 text-left hover:shadow-sm disabled:opacity-60"
            onClick={() => vote(current.b.key, current.a.key)}
            disabled={submitting}
          >
            <div className="text-xs text-gray-500 mb-1">{current.b.species}</div>
            <div className="font-semibold">「{current.b.role}」</div>
          </button>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between text-sm text-gray-600">
        <div>ラウンド進捗：{round + 1} / {totalRounds}</div>
        <Link href="/role-battle" className="px-3 py-1.5 rounded border hover:shadow-sm">
          終了する
        </Link>
      </div>
    </main>
  );
}
