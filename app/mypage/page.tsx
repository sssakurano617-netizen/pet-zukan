// app/mypage/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

// 種類 → 絵文字の対応表
const EMOJI_BY_SPECIES: Record<string, string> = {
  猫: "🐈",
  犬: "🐕",
  ウサギ: "🐇",
  ハムスター: "🐹",
  魚: "🐟",
  鳥類: "🐦",
  その他: "🐾",
};

const FIXED_SPECIES = ["猫", "犬", "ウサギ", "ハムスター", "魚", "鳥類", "その他"];

export default function MyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    species: "猫",
    customSpecies: "",
    name: "",
    role: "",
    comment: "",
    emoji: EMOJI_BY_SPECIES["猫"],
  });
  const [saving, setSaving] = useState(false);

  // 種類変更
  function handleSpeciesChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const species = e.target.value;
    const autoEmoji = EMOJI_BY_SPECIES[species] ?? "🐾";
    setForm((f) => ({ ...f, species, emoji: autoEmoji, customSpecies: "" }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSpecies =
      form.species === "その他" ? form.customSpecies.trim() || "その他" : form.species;

    if (!form.name || !form.role || !form.comment) {
      alert("名前 / 係 / コメント は必須です");
      return;
    }
    if (form.species === "その他" && !form.customSpecies.trim()) {
      alert("その他を選んだ場合は種類を入力してください");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        species: finalSpecies,
        name: form.name,
        role: form.role,
        comment: form.comment,
        emoji: form.emoji,
      };

      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "登録に失敗しました");
        return;
      }
      const saved = await res.json();

      mutate("/api/pets");
      router.push(`/zukan/${saved.id}`);

      setForm({
        species: "猫",
        customSpecies: "",
        name: "",
        role: "",
        comment: "",
        emoji: EMOJI_BY_SPECIES["猫"],
      });
    } catch (e) {
      console.error(e);
      alert("サーバーエラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">マイページ（登録）</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        {/* 種類 */}
        <div>
          <label className="block text-sm font-medium">種類</label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.species}
            onChange={handleSpeciesChange}
          >
            {FIXED_SPECIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {form.species === "その他" && (
            <input
              className="mt-2 w-full rounded border p-2"
              placeholder="ペットの種類（例: フェレット / カメ / インコ）"
              value={form.customSpecies}
              onChange={(e) => setForm((f) => ({ ...f, customSpecies: e.target.value }))}
            />
          )}
        </div>

        {/* 名前 */}
        <div>
          <label className="block text-sm font-medium">名前</label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="こむぎ など"
          />
        </div>

        {/* 係 */}
        <div>
          <label className="block text-sm font-medium">係（役割）</label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="起床係 / おやつほしい係 など"
          />
        </div>

        {/* コメント */}
        <div>
          <label className="block text-sm font-medium">コメント</label>
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={3}
            value={form.comment}
            onChange={(e) =>
              setForm((f) => ({ ...f, comment: e.target.value }))
            }
            placeholder="具体的なエピソード"
          />
        </div>

        {/* 絵文字 */}
        <div>
          <label className="block text-sm font-medium">絵文字（自動 / 手動OK）</label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={form.emoji}
            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            placeholder="🐈 / 🐕 / 🐇 / 🐹 / 🐟 / 🐦 / 🐾 など"
          />
          <p className="mt-1 text-xs text-gray-500">
            種類を変えると自動で絵文字が切り替わります。上の欄で手動上書きもできます。
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "保存中…" : "公開図鑑に保存"}
        </button>
      </form>
    </main>
  );
}
