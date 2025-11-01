// app/home/page.tsx
"use client";

import Link from "next/link";

export default function Menu() {
  return (
    <main className="relative min-h-screen overflow-hidden">
     {/* === 背景 === */}
<div
  className="fixed inset-0 -z-10 bg-black flex items-center justify-center"
>
  <img
    src="/images/menu-bg.jpg"      // /public/images/menu-bg.jpg
    alt=""
    className="max-w-[1980px] max-h-[1080px] w-full h-full object-contain"
  />
</div>


      {/* === ボタン一式（バー無し・1980px幅・上寄せ） === */}
      <div
        className="fixed left-1/2 z-20 -translate-x-1/2 px-4"
        style={{
          bottom: "40vh",                       // ← もっと上なら 40vh/45vh へ
          width: "min(1980px, 100vw)",          // 画像幅に合わせる
        }}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <BoardButton href="/post" label="投稿" />
          <BoardButton href="/zukan" label="図鑑" />
          <BoardButton href="/role-battle" label="役割対決" />
        </div>
      </div>
    </main>
  );
}

/** バーを無くした代わりに、ボタン自体に立体影を付与 */
function BoardButton({ href, label }: { href: string; label: string }) {
  const base =
    "group relative isolate flex items-center justify-center rounded-[16px] border-2 px-16 py-6 text-xl font-bold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f55c00]/30";
  const idle =
    // 立体影を強めに（手前に浮いて見える）
    "bg-white text-black border-[#e5e5e5] shadow-[0_6px_0_rgba(0,0,0,.10),0_16px_32px_rgba(0,0,0,.18)]";
  const hover =
    // オレンジ時に軽く持ち上がる＆影を深く
    "hover:bg-[#f55c00] hover:text-white hover:border-[#d94d00] hover:-translate-y-0.5 hover:shadow-[0_10px_0_rgba(0,0,0,.10),0_28px_48px_rgba(0,0,0,.22)]";
  const active = "active:translate-y-[0px]"; // クリック時は元に戻る感

  return (
    <Link href={href} className={`${base} ${idle} ${hover} ${active}`}>
      {/* 左上の鉤括弧 */}
      <CornerBracket side="left-top" />
      {/* 右下の鉤括弧 */}
      <CornerBracket side="right-bottom" />

      {/* ラベル */}
      <span className="relative z-[1]">{label}</span>

      {/* オレンジ時の内側グロー（バーが無くても映えるように維持） */}
      <span
        className="pointer-events-none absolute inset-0 -z-10 rounded-[14px] opacity-0 transition group-hover:opacity-100"
        style={{
          boxShadow:
            "inset 0 0 0 2px rgba(255,255,255,.7), inset 0 12px 28px rgba(255,255,255,.18), 0 12px 24px rgba(249, 98, 0, .25)",
        }}
      />
    </Link>
  );
}

/** 青+白太縁の鉤括弧（角に配置） */
function CornerBracket({
  side,
}: {
  side: "left-top" | "right-bottom";
}) {
  const isLeftTop = side === "left-top";
  return (
    <span
      className={[
        "pointer-events-none absolute opacity-0 transition duration-200 ease-out",
        "group-hover:opacity-100 group-focus-visible:opacity-100",
        isLeftTop
          ? "left-0 top-0 -translate-x-3 -translate-y-3"
          : "right-0 bottom-0 translate-x-3 translate-y-3 rotate-180",
      ].join(" ")}
      aria-hidden
    >
      <svg
        width="46"
        height="34"
        viewBox="0 0 46 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 白の太縁 */}
        <path
          d="M40 4 L14 4 L6 12 L6 30"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 青の本体 */}
        <path
          d="M40 4 L14 4 L6 12 L6 30"
          stroke="#3a8cd6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
