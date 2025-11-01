// app/menu/page.tsx
"use client";

import WoodButton from "@/components/WoodButton";

export default function MenuPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 背景（/public/images/menu-bg.jpg を置く） */}
      <div
        className="absolute inset-0 -z-10 bg-center bg-cover"
        style={{ backgroundImage: "url(/images/menu-bg.jpg)" }}
      />
      {/* うっすらオーバーレイ（必要なら透明度調整可） */}
      <div className="absolute inset-0 -z-10 bg-white/0" />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-2 text-3xl font-bold">🐾 ペットの役割アプリ</h1>
        <p className="mb-10 text-sm">図鑑 / マイページ / 投稿 へ移動できます。</p>

        {/* 上段3ボタン */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <WoodButton href="/zukan">図鑑ページ</WoodButton>
          <WoodButton href="/mypage">マイページ</WoodButton>
          <WoodButton href="/post">投稿</WoodButton>
        </div>

        {/* 下段「役割対決」だけ少し大きめ */}
        <div className="mt-10">
          <WoodButton href="/role-battle" className="px-14 py-6 text-xl">
            役割対決
          </WoodButton>
        </div>
      </div>
    </main>
  );
}
