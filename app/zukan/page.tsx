// app/zukan/page.tsx
"use client";

import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useState } from "react";

type ServerPet = {
  id: number;
  species: string;
  name: string;
  role: string;
  comment: string;
  emoji?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 固定順
const FIXED_ORDER = ["犬", "猫", "ウサギ", "ハムスター", "魚", "鳥類", "その他"] as const;

export default function Zukan() {
  const { data, error, isLoading } = useSWR<ServerPet[]>("/api/pets", fetcher);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  if (error)
    return <main className="mx-auto max-w-5xl p-6">読み込みに失敗しました。</main>;
  if (isLoading || !data)
    return <main className="mx-auto max-w-5xl p-6">読み込み中…</main>;

  // グループ化
  const grouped: Record<string, ServerPet[]> = data.reduce((acc, p) => {
    (acc[p.species] ??= []).push(p);
    return acc;
  }, {} as Record<string, ServerPet[]>);

  // 表示順：固定順 + 固定外
  const fixed = FIXED_ORDER.filter((sp) => grouped[sp]?.length > 0);
  const extras = Object.keys(grouped).filter(
    (sp) => !FIXED_ORDER.includes(sp as any)
  );
  const speciesOrder = [...fixed, ...extras];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">公開カード 図鑑</h1>

      {data.length === 0 ? (
        <p className="text-sm text-gray-500">まだカードがありません。</p>
      ) : (
        <div className="space-y-10">
          {speciesOrder.map((sp) => (
            <section key={sp}>
              <div className="mb-3">
                <h2 className="text-lg font-semibold">{sp}</h2>
                <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: "#7E9286" }} />
              </div>

              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[sp].map((p) => {
                  const isOpen = openMenuId === p.id;
                  return (
                    <li
                      key={p.id}
                      className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      {/* === 縦三点メニュー === */}
                      <div
                        className="absolute right-2 top-2 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label="カードメニューを開く"
                          aria-haspopup="menu"
                          aria-expanded={isOpen}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId((prev) => (prev === p.id ? null : p.id));
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <span className="text-lg leading-none">⋮</span>
                        </button>
                        {isOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 mt-2 w-36 overflow-hidden rounded-lg border bg-white shadow-lg z-50"
                          >
                            <button
                              role="menuitem"
                              onClick={(e) => {
                                e.preventDefault();
                                mutate(
                                  "/api/pets",
                                  (prev: ServerPet[] | undefined) =>
                                    prev ? prev.filter((q) => q.id !== p.id) : prev,
                                  false
                                );
                                fetch(`/api/pets/${p.id}`, { method: "DELETE" })
                                  .then((res) => {
                                    if (!res.ok) throw new Error();
                                  })
                                  .catch(() => alert("削除に失敗しました"))
                                  .finally(() => mutate("/api/pets"));
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                            >
                              削除する
                            </button>
                          </div>
                        )}
                      </div>

                      {/* カード本体 */}
                      <Link
                        href={`/zukan/${p.id}`}
                        className="block"
                        onClick={() => setOpenMenuId(null)}
                      >
                        <div className="text-4xl">{p.emoji ?? "🐾"}</div>
                        <h2 className="mt-2 text-lg font-semibold">
                          {p.name}
                          {p.role && <span className="ml-1 text-gray-600">（{p.role}）</span>}
                        </h2>
                        <p className="text-sm text-gray-500">{p.species}</p>
                        <p className="mt-2 text-sm line-clamp-3">{p.comment}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
