// app/apriltag-test/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TagResult = { id: number; corners: { x: number; y: number }[] };

declare global {
  interface Window {
    AprilTag?: (opts?: { wasmPath?: string }) => Promise<{
      detect: (
        data: Uint8ClampedArray,
        width: number,
        height: number,
        options?: { family?: "tag36h11" | string }
      ) => TagResult[];
      close?: () => void;
    }>;
  }
}

export default function AprilTagTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const [diag, setDiag] = useState<string>("");

  // 1) カメラ起動
  useEffect(() => {
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCamReady(true);
        }
      } catch (e) {
        alert("カメラ権限が必要です。localhost または https で許可してください。");
      }
    })();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // 2) 検出ループ
  useEffect(() => {
    if (!camReady || !wasmReady) return;
    let mounted = true;
    let raf = 0;
    let detector: Awaited<ReturnType<NonNullable<typeof window.AprilTag>>> | null = null;

    (async () => {
      // ★ ローカルの .wasm を使う
      const wasmPath = "/wasm/apriltag.wasm";
      if (!window.AprilTag) {
        setDiag("AprilTagローダー未読込");
        return;
      }
      detector = await window.AprilTag({ wasmPath });
      if (!mounted) return;

      const loop = () => {
        if (!mounted) return;
        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        const w = video.videoWidth, h = video.videoHeight;
        if (!w || !h) {
          raf = requestAnimationFrame(loop);
          return;
        }
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);

        const results = detector!.detect(img.data, w, h, { family: "tag36h11" }) as TagResult[];
        setDiag(`frame: ${w}x${h}, results: ${results.length}`);

        ctx.drawImage(video, 0, 0, w, h);

        if (results.length) {
          const r = results[0];
          setLastId(r.id);

          // 緑の枠
          ctx.strokeStyle = "#00FF55";
          ctx.lineWidth = 3;
          ctx.beginPath();
          r.corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.closePath();
          ctx.stroke();

          // 中心とラベル
          const cx = r.corners.reduce((s, p) => s + p.x, 0) / 4;
          const cy = r.corners.reduce((s, p) => s + p.y, 0) / 4;
          ctx.fillStyle = "#00FF55";
          ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = "rgba(0,0,0,.6)";
          ctx.fillRect(cx + 8, cy - 20, 90, 22);
          ctx.fillStyle = "#fff";
          ctx.font = "14px system-ui, sans-serif";
          ctx.fillText(`ID: ${r.id}`, cx + 12, cy - 5);
        } else {
          setLastId(null);
        }

        raf = requestAnimationFrame(loop);
      };

      loop();
    })();

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      detector?.close?.();
    };
  }, [camReady, wasmReady]);

  return (
    <main className="space-y-3">
      {/* 3) ローカルの apriltag.js を読み込む */}
      <Script
        src="/wasm/apriltag.js"
        strategy="beforeInteractive"
        onLoad={() => setWasmReady(true)}
        onError={() => setDiag("apriltag.js の読み込みに失敗")}
      />

      <h1 className="text-xl font-bold">AprilTagテスト</h1>
      <div className="text-sm">
        カメラ：{camReady ? "準備OK" : "準備中…"}　/　WASM：{wasmReady ? "準備OK" : "読込中…"}　/　検出ID：{lastId ?? "—"}
      </div>
      <pre className="text-xs bg-black/70 text-white p-2 rounded w-fit">{diag}</pre>

      <div className="flex gap-4 items-start">
        <video ref={videoRef} autoPlay playsInline muted className="w-[320px] border rounded" />
        <canvas ref={canvasRef} className="w-[320px] border rounded" />
      </div>

      <ul className="text-xs text-gray-600 list-disc pl-5">
        <li>印刷は <b>AprilTag 36h11</b> を使用（他の家系は検出されません）。</li>
        <li>サイズは 3〜6cm 四方・明るい場所・カメラに正対で試してください。</li>
      </ul>
    </main>
  );
}
