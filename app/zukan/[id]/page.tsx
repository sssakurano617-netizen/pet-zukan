// app/zukan/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import type { Pet } from "@/lib/pets";
import { speciesToEmoji } from "@/lib/pets"; // 相対パス環境なら "../../../lib/pets"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });

export default function PetDetailPage() {
  const params = useParams();
  const rawId = (params as Record<string, unknown>)?.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : (rawId as string | undefined);

  if (!idStr || Number.isNaN(Number(idStr))) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="mb-4">指定のIDが不正です。（id: {idStr ?? "不明"}）</p>
        <Link className="text-blue-600 hover:underline" href="/zukan">← 図鑑に戻る</Link>
      </main>
    );
  }

  // 一覧を取得してからクライアント側で該当 id を検索
  const { data, error, isLoading } = useSWR<Pet[]>("/api/pets", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  if (isLoading) return <main className="mx-auto max-w-3xl p-6">読み込み中…</main>;
  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="mb-4">読み込みに失敗しました（id: {idStr}）。</p>
        <Link className="text-blue-600 hover:underline" href="/zukan">← 図鑑に戻る</Link>
      </main>
    );
  }

  const pet = data?.find((p) => p.id === Number(idStr));
  if (!pet) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="mb-4">指定のペットが見つかりません。（id: {idStr}）</p>
        <Link className="text-blue-600 hover:underline" href="/zukan">← 図鑑に戻る</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="text-3xl">{speciesToEmoji(pet.species)}</div>
        <div>
          <h1 className="text-xl font-semibold">
            {pet.name}（{pet.species}）
          </h1>
          <p className="text-sm text-gray-600">
            役割：{pet.role}　/　コメント：{pet.comment}
          </p>
        </div>
      </header>

      <Link className="text-blue-600 hover:underline" href="/zukan">← 図鑑に戻る</Link>
    </main>
  );
}
