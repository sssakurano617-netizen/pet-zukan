// app/taiketsu/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { ROLE_POOL, RoleItem } from "./roles";

type Genre = "意外" | "おもしろい" | "人の役に立つ";

const GENRES: Genre[] = ["意外", "おもしろい", "人の役に立つ"];

// なんちゃって集計：localStorageキー
const LS_KEY = "taiketsu_votes_v1";
// 保存する形：{ [roleId]: number }
function loadVotes(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function saveVotes(v: Record<string, number>) {
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}

export default function TaiketsuPage() {
  const [genre, setGenre] = useState<Genre>("意外");
  const [pair, setPair] = useState<RoleItem[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});

  // 初回＆ジャンル変更で2つ抽選
  const drawPair = (g: Genre) => {
    const candidates = ROLE_POOL.filter(r => !r.tags || r.tags.includes(g));
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    setPair(shuffled.slice(0, 2));
    setPickedId(null);
    setShowResult(false);
  };

  useEffect(() => {
    setVotes(loadVotes());
    drawPair(genre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ジャンル変更
  const onChangeGenre = (g: Genre) => {
    setGenre(g);
    drawPair(g);
  };

  // 投票
  const vote = (id: string) => {
    setPickedId(id);
  };

  // 提出（参加後に結果を表示）
  const submit = () => {
    if (!pickedId) return;
    const next = { ...votes, [pickedId]: (votes[pickedId] || 0) + 1 };
    setVotes(next);
    saveVotes(next);
    setShowResult(true);
  };

  // 結果ビュー（今回の2択に限定した集計表示）
  const currentStats = useMemo(() => {
    const a = pair[0]?.id, b = pair[1]?.id;
    const av = (votes[a] || 0), bv = (votes[b] || 0);
    const total = av + bv || 1;
    return {
      [a]: Math.round((av / total) * 100),
      [b]: Math.round((bv / total) * 100),
    };
  }, [pair, votes]);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">ペットの役割対決</h1>
        <p className="text-sm text-gray-600">
          ジャンルを選び、どちらが「{genre}」かを投票してください。結果は参加後に表示されます。
        </p>
        <div className="flex gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => onChangeGenre(g)}
              className={`px-3 py-1 rounded-2xl border text-sm ${g===genre ? "bg-black text-white" : "bg-white"}`}
            >
              {g}
            </button>
          ))}
        </div>
      </header>

      {/* 2択カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pair.map((r) => (
          <button
            key={r.id}
            onClick={() => vote(r.id)}
            className={`text-left rounded-2xl border p-4 shadow-sm transition
            ${pickedId === r.id ? "ring-2 ring-black" : "hover:shadow-md"}`}
            disabled={showResult}
          >
            <div className="text-xs text-gray-500 mb-1">#{r.pet}</div>
            <div className="font-semibold">{r.role}</div>
            {r.notes && <div className="text-sm text-gray-600 mt-2">{r.notes}</div>}
          </button>
        ))}
      </div>

      {/* アクション */}
      <div className="flex items-center gap-3">
        {!showResult ? (
          <button
            onClick={submit}
            disabled={!pickedId}
            className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-40"
          >
            投票して結果を見る
          </button>
        ) : (
          <button
            onClick={() => drawPair(genre)}
            className="px-4 py-2 rounded-xl border"
          >
            もう一戦！
          </button>
        )}
        <span className="text-xs text-gray-500">
          ※結果はこの2択に限った集計です（デモ）。本番は全体集計に差し替え予定。
        </span>
      </div>

      {/* 結果表示（参加後） */}
      {showResult && pair.length === 2 && (
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-3">みんなの解答</h2>
          <ul className="space-y-2">
            {pair.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <div className="truncate mr-4">
                  <span className="text-xs text-gray-500 mr-2">#{r.pet}</span>
                  <span className="font-medium">{r.role}</span>
                </div>
                <div className="tabular-nums">{currentStats[r.id]}%</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
