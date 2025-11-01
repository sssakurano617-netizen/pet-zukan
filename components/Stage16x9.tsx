// app/components/Stage16x9.tsx
"use client";
import { ReactNode } from "react";

/** ヘッダー下から始まる 16:9 ステージ（中央寄せ） */
export default function Stage16x9({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: "var(--header-h)",
        height: "calc(100vh - var(--header-h))",
        width: "100vw",
        background: "#000",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(100vw, calc((100vh - var(--header-h)) * 16 / 9))",
          aspectRatio: "16 / 9",
          overflow: "hidden",
          background: "#111",
        }}
      >
        {children}
      </div>
    </div>
  );
}
