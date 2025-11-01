"use client";

import { useEffect } from "react";

type Props = {
  /** 肉球検出時の挙動。何も渡さない場合は alert。 */
  onDetect?: () => void;
};

export default function UsePaw({ onDetect }: Props) {
  useEffect(() => {
    const handler = () => {
      if (onDetect) onDetect();
      else alert("🐾 肉球を検出しました");
    };
    window.addEventListener("paw-detected", handler);
    return () => window.removeEventListener("paw-detected", handler);
  }, [onDetect]);

  return null; // 何も描画しない
}
