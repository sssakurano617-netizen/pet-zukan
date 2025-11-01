"use client";
import { useState, useEffect } from "react";

export default function RedCircle({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "fixed",
        left: x - 15,
        top: y - 15,
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "3px solid red",
        pointerEvents: "none", // クリックを邪魔しない
        zIndex: 9999,
      }}
    />
  );
}
