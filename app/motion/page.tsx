// app/motion/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

type Pt = { x: number; y: number };

export default function MotionCameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [debug, setDebug] = useState("init...");

  // HandLandmarker
  const handRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);

  // カーソル位置（平滑化）
  const cursorRef = useRef<Pt>({ x: 0, y: 0 });
  const smoothPts = useRef<Pt[]>([]);

  // 初期化（自動でカメラ開始）
  useEffect(() => {
    startCamera();
    const onResize = () => syncCanvasSize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      stopDetectLoop();
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------- Camera -------------
  const msgFromError = (e: any) => {
    const name = e?.name || "";
    if (name === "NotAllowedError") return "カメラがブロック：URL左のカメラ→『許可』にしてください。";
    if (name === "NotFoundError") return "カメラが見つかりません。他アプリの使用を終了してください。";
    if (name === "NotReadableError") return "カメラにアクセスできません（占有中の可能性）。";
    if (name === "OverconstrainedError") return "指定の解像度に非対応です。";
    return `カメラ取得に失敗: ${name || e?.message || e}`;
  };

  const startCamera = async () => {
    setError("");
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      const v = videoRef.current!;
      v.srcObject = stream;
      v.muted = true;
      (v as any).playsInline = true;

      // メタデータ読込後にキャンバスを同期（サイズ0対策）
      v.onloadedmetadata = () => {
        syncCanvasSize();
      };

      await v.play();
      setRunning(true);

      await ensureHandLandmarker();
      startDetectLoop();
      setDebug("camera: on / hand: ready");
    } catch (e: any) {
      setError(msgFromError(e));
      setRunning(false);
      setDebug("camera: error");
    }
  };

  const stopCamera = () => {
    const v = videoRef.current;
    if (v && v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setRunning(false);
  };

  const syncCanvasSize = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const rect = v.getBoundingClientRect();
    // 物理解像度に合わせる
    c.width = Math.max(1, Math.floor(rect.width));
    c.height = Math.max(1, Math.floor(rect.height));
  };

  // ------------- HandLandmarker -------------
  const ensureHandLandmarker = async () => {
    if (handRef.current) return;
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handRef.current = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
    });
  };

  const startDetectLoop = () => {
    stopDetectLoop();
    const loop = () => {
      try {
        detectOnce();
      } catch (e) {
        // 例外でループが止まらないように
        console.warn(e);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopDetectLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // ------------- 1 frame detect & draw -------------
  const detectOnce = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    const hand = handRef.current;
    if (!v || !c || !hand) return;

    // キャンバスが0サイズだと何も見えない
    if (c.width === 0 || c.height === 0) {
      syncCanvasSize();
      return;
    }

    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);

    // ミラー（動画はCSSで反転、カーソルはここで反転）
    ctx.save();
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);

    const now = performance.now();
    const res: HandLandmarkerResult = hand.detectForVideo(v, now);

    const count = res?.landmarks?.length ?? 0;
    setDebug(`hands:${count} running:${running ? "yes" : "no"}`);

    const lm0 = res?.landmarks?.[0];
    if (lm0) {
      const tip = lm0[8]; // index fingertip
      const px = tip.x * c.width;
      const py = tip.y * c.height;

      // 移動平均でスムージング
      smoothPts.current.push({ x: px, y: py });
      if (smoothPts.current.length > 5) smoothPts.current.shift();
      const sx = smoothPts.current.reduce((s, p) => s + p.x, 0) / smoothPts.current.length;
      const sy = smoothPts.current.reduce((s, p) => s + p.y, 0) / smoothPts.current.length;
      cursorRef.current = { x: sx, y: sy };

      // === 赤丸（太め・見やすく） ===
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,0,0,0.95)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,0,0,0.95)";
      ctx.fill();
    }

    ctx.restore();
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">モーション操作（赤丸復活版）</h1>
      <div className="mb-3 flex items-center gap-2">
        {!running ? (
          <button onClick={startCamera} className="px-4 py-2 rounded-lg bg-black text-white">
            カメラ開始
          </button>
        ) : (
          <button
            onClick={() => {
              stopDetectLoop();
              stopCamera();
            }}
            className="px-4 py-2 rounded-lg bg-gray-200"
          >
            停止
          </button>
        )}
        {error && <span className="text-red-600 text-sm">{error}</span>}
        <span className="ml-auto text-xs text-gray-600">debug: {debug}</span>
      </div>

      {/* ミラー表示（動画はCSSで反転） */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover transform -scale-x-100"
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10" />
      </div>
    </main>
  );
}
