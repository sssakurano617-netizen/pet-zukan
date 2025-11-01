// components/BlobButton.tsx
"use client";

import Link from "next/link";

type Variant = "primary" | "danger";

type Props = {
  label: string;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  className?: string;
};

function cn(...args: Array<string | undefined | false>) {
  return args.filter(Boolean).join(" ");
}

export default function BlobButton({
  label,
  variant = "primary",
  href,
  onClick,
  className,
}: Props) {
  const isLink = typeof href === "string";
  const id = `grad-${variant}`;

  const colors =
    variant === "primary"
      ? {
          from: "#66B9FF",
          mid: "#3DA1F0",
          to: "#2187E1",
        }
      : {
          from: "#FFA489",
          mid: "#F06C56",
          to: "#DE4636",
        };

  const Content = (
    <span
      className={cn(
        "relative inline-flex select-none items-center justify-center",
        "transition-transform duration-150 ease-out",
        "active:translate-y-[2px] hover:-translate-y-[1px]",
        className
      )}
      style={{
        /* 外側の影（ドロップシャドウ） */
        filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))",
      }}
    >
      <svg
        width="260"
        height="86"
        viewBox="0 0 320 106"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        aria-hidden
      >
        <defs>
          {/* 本体グラデーション */}
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="55%" stopColor={colors.mid} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>

          {/* 上部ツヤ */}
          <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* 内側の影（押し込み感） */}
          <filter id={`${id}-inner`} x="-50%" y="-50%" width="200%" height="200%">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.35 0"
            />
            <feBlend in="SourceGraphic" />
          </filter>
        </defs>

        {/* 不規則な四角（輪郭なし / 影で立体感） */}
        <path
          d="
            M 18 48
            C 16 34, 30 20, 62 16
            L 246 12
            C 278 10, 302 22, 304 38
            L 306 64
            C 308 78, 292 92, 266 94
            L 54 98
            C 30 100, 16 90, 14 74
            Z
          "
          fill={`url(#${id})`}
          filter={`url(#${id}-inner)`}
        />

        {/* 上部の光沢 */}
        <path
          d="
            M 28 40
            C 32 28, 56 22, 94 20
            L 238 18
            C 270 18, 292 26, 294 34
            L 294 36
            C 260 42, 208 42, 110 44
            C 72 45, 44 44, 28 40 Z
          "
          fill={`url(#${id}-gloss)`}
        />
      </svg>

      {/* テキスト */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 grid place-items-center",
          "text-white font-bold tracking-wide",
          "text-[18px] md:text-[20px] leading-none",
          "drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]"
        )}
      >
        {label}
      </span>
    </span>
  );

  if (isLink) {
    return (
      <Link href={href!} className="inline-block font-button">
        {Content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="inline-block font-button">
      {Content}
    </button>
  );
}
