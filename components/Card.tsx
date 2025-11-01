// components/Card.tsx
"use client";
import { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white
        shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]
        hover:border-gray-300 ${className}`}
    >
      {children}
    </div>
  );
}

