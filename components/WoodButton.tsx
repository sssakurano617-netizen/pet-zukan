// components/WoodButton.tsx
"use client";

import Link from "next/link";
import React from "react";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function WoodButton({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={[
        "group relative inline-flex items-center justify-center",
        "px-10 py-5 rounded-[20px] font-bold text-lg",
        "bg-white text-black",
        "shadow-[0_8px_0_rgba(0,0,0,0.12),0_20px_40px_rgba(0,0,0,0.08)]",
        "transition-all duration-200",
        "hover:bg-[#f55c00] hover:text-white",
        "focus:bg-[#f55c00] focus:text-white outline-none",
        className,
      ].join(" ")}
    >
      {/* 木目ボード（/public/images/wood-board.png を置く） */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[22px] bg-[url('/images/wood-board.png')] bg-cover bg-center opacity-60 group-hover:opacity-80"
      />
      {/* 左カギ括弧（青＋白太縁） */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 h-10 w-10 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path d="M38 2 H10 V30" fill="none" stroke="#3a8cd6" strokeWidth="10" />
          <path d="M38 2 H10 V30" fill="none" stroke="#ffffff" strokeWidth="4" />
        </svg>
      </span>
      {/* 右カギ括弧（反転） */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-10 w-10 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity rotate-180"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path d="M38 2 H10 V30" fill="none" stroke="#3a8cd6" strokeWidth="10" />
          <path d="M38 2 H10 V30" fill="none" stroke="#ffffff" strokeWidth="4" />
        </svg>
      </span>

      {children}
    </Link>
  );
}
