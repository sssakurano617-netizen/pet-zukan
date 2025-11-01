// app/page.tsx
"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* === 背景動画 === */}
      <video
        key="home-video"
        className="pointer-events-none fixed inset-0 m-auto bg-black"
        src="/videos/home.mp4"
        poster="/videos/home.jpg"
        autoPlay
        muted
        loop
        playsInline
        style={{
          objectFit: "contain",        // 切らずに全体を表示
          objectPosition: "center",    // 中央寄せ
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />

      {/* うっすらオーバーレイ（必要なら調整） */}
      <div className="fixed inset-0 bg-white/10" />

      {/* === ボタン：画面下から中間に固定配置（中央寄せ） === */}
      <div
        className="fixed left-1/2 z-20 w-full max-w-6xl -translate-x-1/2 px-6"
        style={{ bottom: "14vh" }} // 12〜16vhで微調整可
      >
        {/* 木のボード風の土台 */}
        <div
          className="w-full max-w-3xl mx-auto rounded-[22px] p-4 shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_8px_18px_rgba(0,0,0,.18)]"
          style={{
            background:
              "linear-gradient(180deg, #f6d68b 0%, #e9ba63 40%, #dca95a 60%, #c89447 100%)",
            border: "2px solid #b77c35",
          }}
        >
          {/* 中央に1個だけ表示 */}
          <div className="p-2 flex justify-center">
            <BoardButton href="/home" label="スタート" />
          </div>
        </div>
      </div>
    </main>
  );
}

/** 木のボード上に載せるボタン */
function BoardButton({ href, label }: { href: string; label: string }) {
  const base =
    "group relative isolate flex items-center justify-center rounded-[16px] border-2 px-70 py-11 text-xl font-bold transition duration-200 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f55c00]/30";
  const idle =
    "bg-white text-black border-[#e5e5e5] shadow-[0_2px_0_rgba(0,0,0,.08)]";
  const hover = "hover:bg-[#f55c00] hover:text-white hover:border-[#d94d00]";
  const active = "active:translate-y-[1px]";

  return (
    <Link href={href} className={`${base} ${idle} ${hover} ${active}`}>
      {/* 左上の鉤括弧 */}
      <CornerBracket side="left-top" />
      {/* 右下の鉤括弧 */}
      <CornerBracket side="right-bottom" />

      {/* ラベル */}
      <span className="relative z-[1]">{label}</span>

      {/* オレンジ時の内側グロー */}
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
