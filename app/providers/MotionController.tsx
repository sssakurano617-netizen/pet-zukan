// app/providers/MotionController.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

type Pt = { x: number; y: number };

/** ======= 調整パラメータ ======= */
const INACTIVITY_SEC = 20;          // 20秒誰も映らなければホームへ
const SWIPE_AMPLITUDE = 0.18;
const SWIPE_DIRECTION = 0.10;
const SWIPE_COOLDOWN = 650;

// ★ 2秒ドウェル
const DWELL_MS = 2000;              // 2秒ホバーでクリック
const MOVE_TOLERANCE_PX = 24;

const CLICK_COOLDOWN_MS = 800;      // ★ 自動クリックの連打防止

const CLAP_THRESH = 0.18;
const CLAP_COOLDOWN = 600;

const ROUTES = ["/", "/zukan", "/taiketsu"];  // 必要なら

export default function MotionController() {
  const router = useRouter();
  const pathname = usePathname();

  // DOM参照
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  // ランタイム状態
  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);

  // HandLandmarker
  const handRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);

  // カーソル／平滑化
  const cursorRef = useRef<Pt>({ x: 0, y: 0 });
  const smoothPts = useRef<Pt[]>([]);
  const xHist = useRef<number[]>([]);
  const lastSwipeAt = useRef(0);

  // 不在検知
  const lastSeenAt = useRef<number>(Date.now());
  const absentTimerRef = useRef<number | null>(null);

  // 拍手（マイク）
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const lastClapAt = useRef(0);

  // ドウェル（クリック対象・開始点・進捗・クールダウン）
  const dwellStartRef = useRef<number | null>(null);
  const lastStablePosRef = useRef<Pt>({ x: 0, y: 0 });
  const dwellProgressRef = useRef<number>(0); // 0..1
  const dwellTargetRef = useRef<HTMLElement | null>(null);
  const lastAutoClickAtRef = useRef(0);

  // ★ クリック効果音
  const clickSfxRef = useRef<HTMLAudioElement | null>(null);
  const playClickSfx = () => {
    const a = clickSfxRef.current;
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  };

  // UIミニ通知（任意）
  const [banner, setBanner] = useState<string | null>(null);
  const flash = (t: string) => { setBanner(t); setTimeout(() => setBanner(null), 700); };

  /** ======= ユーティリティ ======= */
  const sizeOverlayToWindow = () => {
    const c = overlayRef.current;
    if (!c) return;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    c.width = Math.floor(cssW * dpr);     // デバイスピクセル
    c.height = Math.floor(cssH * dpr);
    c.style.width = `${cssW}px`;          // CSSピクセル
    c.style.height = `${cssH}px`;
    const ctx = c.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 描画はCSSピクセル座標でOK
  };
  const routeIndex = () => Math.max(0, ROUTES.indexOf(pathname || "/"));
  const goNext = () => router.push(ROUTES[(routeIndex() + 1) % ROUTES.length]);
  const goPrev = () => router.push(ROUTES[(routeIndex() - 1 + ROUTES.length) % ROUTES.length]);
  const isZukanDetail = () => pathname?.startsWith("/zukan/") && pathname !== "/zukan";

  /** ======= 起動／停止 ======= */
  useEffect(() => {
    // ★ 効果音のプリロード
    clickSfxRef.current = new Audio("/sounds/decide.mp3");
    if (clickSfxRef.current) {
      clickSfxRef.current.preload = "auto";
      clickSfxRef.current.volume = 0.9;
    }

    const onFirstClick = async () => {
      window.removeEventListener("click", onFirstClick);

      // ★ iOS/Safari 向けの“再生許可”プライム（無音で瞬時に再生→停止）
      try {
        await clickSfxRef.current?.play();
        clickSfxRef.current?.pause();
        if (clickSfxRef.current) clickSfxRef.current.currentTime = 0;
      } catch {}

      await startCamera();
      await ensureHands();
      startLoop();
      startAbsentWatch();
    };
    window.addEventListener("click", onFirstClick, { once: true });

    const onResize = () => sizeOverlayToWindow();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("click", onFirstClick);
      window.removeEventListener("resize", onResize);
      stopLoop();
      stopCamera();
      stopMic();
      stopAbsentWatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ======= カメラ ======= */
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    });
    const v = videoRef.current!;
    v.srcObject = stream;
    v.muted = true;
    (v as any).playsInline = true;
    await v.play();
    setRunning(true);
    sizeOverlayToWindow();
  };
  const stopCamera = () => {
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setRunning(false);
  };

  /** ======= 手検出 ======= */
  const ensureHands = async () => {
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
  const startLoop = () => {
    stopLoop();
    const loop = () => { detectOnce(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  };
  const stopLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const detectOnce = () => {
    const v = videoRef.current;
    const c = overlayRef.current;
    const hand = handRef.current;
    if (!v || !c || !hand) return;

    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);

    const now = performance.now();
    const res: HandLandmarkerResult = hand.detectForVideo(v, now);

    const lm0 = res?.landmarks?.[0];
    if (lm0) {
      lastSeenAt.current = Date.now();

      // ==== CSSピクセルで指先座標（ミラー補正） ====
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      const tip = lm0[8];
      const px = (1 - tip.x) * cssW;   // 左右反転（CSS px）
      const py = tip.y * cssH;

      // 平滑化（移動平均）
      smoothPts.current.push({ x: px, y: py });
      if (smoothPts.current.length > 5) smoothPts.current.shift();
      const sx = smoothPts.current.reduce((s, p) => s + p.x, 0) / smoothPts.current.length;
      const sy = smoothPts.current.reduce((s, p) => s + p.y, 0) / smoothPts.current.length;

      cursorRef.current = { x: sx, y: sy };

      // ---- カーソル丸（朱色で太く & 影）----
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#E60033";   // 外側リング色（枠）
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#E60033";     // 内側ドット
      ctx.fill();
      ctx.shadowBlur = 0;

      // ---- 2秒ホバー → クリック（クリック対象の上でのみ進む）----
      handleDwellClick(ctx, sx, sy);

      // （必要なら）左右スワイプ（正規化xで）
      xHist.current.push(tip.x);
      if (xHist.current.length > 12) xHist.current.shift();
      trySwipe();
    }
  };

  /** ホバー（ドウェル）検出＆描画 */
  const handleDwellClick = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const now = performance.now();

    // “図鑑の詳細ページ以外”でのみホバークリックを有効化
    const enableDwell = !isZukanDetail();
    if (!enableDwell) {
      resetDwell();
      lastStablePosRef.current = { x, y };
      return;
    }

    // カーソル下のクリック対象を判定（CSSピクセルのx,y）
    const base = document.elementFromPoint(x, y) as HTMLElement | null;
    const target = findClickable(base);

    // 対象が変わったらリセット
    if (target !== dwellTargetRef.current) {
      dwellTargetRef.current = target;
      dwellStartRef.current = null;
      dwellProgressRef.current = 0;
      lastStablePosRef.current = { x, y };
    }

    // 対象が無ければ進捗は描かない
    if (!target) {
      resetDwell();
      lastStablePosRef.current = { x, y };
      return;
    }

    // 移動量チェック
    const last = lastStablePosRef.current;
    const dist = Math.hypot(x - last.x, y - last.y);

    if (dist <= MOVE_TOLERANCE_PX) {
      if (dwellStartRef.current == null) dwellStartRef.current = now;
      const elapsed = now - (dwellStartRef.current ?? now);
      let p = Math.max(0, Math.min(1, elapsed / DWELL_MS));
      dwellProgressRef.current = p;

      // 背景リング（薄いグレー）
      const r = 22;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.stroke();

      // 進捗リング（白）— 一周したらクリック
      const start = -Math.PI / 2;
      const end = start + Math.PI * 2 * p;
      ctx.beginPath();
      ctx.arc(x, y, r, start, end, false);
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      if (p >= 1 && now - lastAutoClickAtRef.current > CLICK_COOLDOWN_MS) {
        clickTarget(target, x, y);     // ← 自動クリック！（ここで効果音も鳴る）
        lastAutoClickAtRef.current = now;
        resetDwell();
        flash("auto click");
      }
    } else {
      // 動いたらリセット
      resetDwell();
      lastStablePosRef.current = { x, y };
    }
  };

  const resetDwell = () => {
    dwellStartRef.current = null;
    dwellProgressRef.current = 0;
  };

  /** スワイプ（使うなら） */
  const trySwipe = () => {
    const xs = xHist.current;
    if (xs.length < 8) return;
    const now = performance.now();
    if (now - lastSwipeAt.current < SWIPE_COOLDOWN) return;
    const min = Math.min(...xs), max = Math.max(...xs);
    const amplitude = max - min;
    const direction = xs[xs.length - 1] - xs[0];
    if (amplitude > SWIPE_AMPLITUDE && Math.abs(direction) > SWIPE_DIRECTION) {
      lastSwipeAt.current = now;
      // direction>0 ? goNext() : goPrev();
    }
  };

  /** 不在20秒でホームへ */
  const startAbsentWatch = () => {
    stopAbsentWatch();
    absentTimerRef.current = window.setInterval(() => {
      const goneMs = Date.now() - lastSeenAt.current;
      if (goneMs > INACTIVITY_SEC * 1000 && pathname !== "/") router.push("/");
    }, 500);
  };
  const stopAbsentWatch = () => {
    if (absentTimerRef.current) clearInterval(absentTimerRef.current);
    absentTimerRef.current = null;
  };

  /** ==== 拍手（図鑑“詳細”のときだけ → 次へめくる）==== */
  const startMic = async () => {
    if (listening) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    micStreamRef.current = stream;
    setListening(true);

    const buf = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!listening || !analyserRef.current) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const now = performance.now();

      if (rms > CLAP_THRESH && now - lastClapAt.current > CLAP_COOLDOWN) {
        lastClapAt.current = now;
        if (isZukanDetail()) {
          flipZukanNext();
          flash("👏 flip");
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const stopMic = () => {
    setListening(false);
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => {});
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    analyserRef.current = null;
    audioCtxRef.current = null;
    micStreamRef.current = null;
  };

  /** 図鑑“詳細”の次カードへ */
  const flipZukanNext = () => {
    const seqRaw = localStorage.getItem("zukanOrder") || "";
    const paths = seqRaw
      ? (JSON.parse(seqRaw) as string[]).map((href) => new URL(href, location.origin).pathname)
      : [];
    const cur = pathname || location.pathname;

    let nextPath: string | null = null;

    if (paths.length > 0) {
      const i = paths.indexOf(cur);
      if (i >= 0) nextPath = paths[(i + 1) % paths.length];
    }

    if (!nextPath) {
      const m = cur.match(/^\/zukan\/(\d+)(?:\/)?$/);
      if (m) nextPath = `/zukan/${Number(m[1]) + 1}`;
    }

    if (!nextPath) {
      const el =
        (document.querySelector("[data-flip-next]") as HTMLElement | null) ||
        (document.querySelector('a[rel="next"]') as HTMLElement | null);
      if (el) {
        try { (el as any).click?.(); } catch {}
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        return;
      }
    }

    if (nextPath) router.push(nextPath);
  };

  /** カーソル下の“近いインタラクティブ祖先”を返す */
  const findClickable = (el: HTMLElement | null): HTMLElement | null => {
    let e: HTMLElement | null = el;
    while (e) {
      const tag = e.tagName.toLowerCase();
      if (
        tag === "a" ||
        tag === "button" ||
        e.getAttribute("role") === "button" ||
        e.dataset.clickable === "true" ||
        e.dataset.dwellable === "true" // ← 任意で付けて拡張
      ) {
        return e;
      }
      e = e.parentElement;
    }
    return null;
  };

  /** 指定要素をクリック（★ここで効果音を鳴らす） */
  const clickTarget = (target: HTMLElement, clientX: number, clientY: number) => {
    // ★ 効果音
    playClickSfx();

    try { (target as any).click?.(); } catch {}
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX, clientY }));
    // Enter も送っておくとアクセシビリティ的に安定
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
  };

  /** ======= UI（画面には映さない / 指カーソルだけ薄く表示） ======= */
  return (
    <>
      {/* 非表示video（検出だけに使用） */}
      <video
        ref={videoRef}
        className="fixed w-[1px] h-[1px] opacity-0 pointer-events-none -left-[9999px] -top-[9999px]"
        autoPlay
        muted
        playsInline
      />
      {/* 画面全体オーバーレイ（最前面に） */}
      <canvas ref={overlayRef} className="fixed inset-0 pointer-events-none z-[99999]" />

      {/* 操作用の小ボタン（展示時はCSSで隠してOK） */}
      {!running ? (
        <button
          onClick={async () => { await startCamera(); await ensureHands(); startLoop(); startAbsentWatch(); }}
          className="fixed left-3 bottom-3 z-[60] px-3 py-1.5 rounded bg-black text-white text-xs opacity-70 hover:opacity-100"
        >
          モーション開始
        </button>
      ) : (
        <button
          onClick={() => { stopLoop(); stopCamera(); stopMic(); stopAbsentWatch(); }}
          className="fixed left-3 bottom-3 z-[60] px-3 py-1.5 rounded bg-gray-200 text-xs opacity-70 hover:opacity-100"
        >
          停止
        </button>
      )}

      {!listening ? (
        <button
          onClick={startMic}
          className="fixed left-3 bottom-12 z-[60] px-3 py-1.5 rounded bg-indigo-600 text-white text-xs opacity-70 hover:opacity-100"
        >
          マイク開始（拍手でめくる）
        </button>
      ) : (
        <button
          onClick={stopMic}
          className="fixed left-3 bottom-12 z-[60] px-3 py-1.5 rounded bg-gray-200 text-xs opacity-70 hover:opacity-100"
        >
          マイク停止
        </button>
      )}

      {/* ミニ通知 */}
      {banner && (
        <div className="fixed right-3 top-3 z-[70] px-3 py-1 rounded bg-black/70 text-white text-sm">
          {banner}
        </div>
      )}
    </>
  );
}
