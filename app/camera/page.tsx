// app/camera/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/** 内蔵っぽい名称を除外して “外付け” を優先選択 */
function pickExternal(list: MediaDeviceInfo[]) {
  const cams = list.filter(d => d.kind === "videoinput");
  const externals = cams.filter(d => !/FaceTime|Integrated|Built[- ]?in|内蔵/i.test(d.label));
  return (externals[0] ?? cams[0])?.deviceId ?? "";
}

/** 外付けカメラを優先して video に接続。選択は localStorage に保存 */
export async function openPreferredCamera(video: HTMLVideoElement) {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
    throw new Error("この環境は getUserMedia に未対応です（HTTPSで開いているか確認）");
  }

  // ラベル取得のため最初に軽く権限を通す（既に許可済みなら無音で通る）
  await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(s => {
    s.getTracks().forEach(t => t.stop());
  }).catch((e) => {
    // ここで拒否されたら以降の列挙で label が空になる
    console.warn("初回権限要求が拒否:", e);
  });

  const all = await navigator.mediaDevices.enumerateDevices();
  const saved = localStorage.getItem("preferredCameraId");
  const hasSaved = saved && all.some(d => d.kind === "videoinput" && d.deviceId === saved);
  const deviceId = hasSaved ? (saved as string) : pickExternal(all);

  // “外付けを明示”して起動（失敗時はフォールバック）
  let stream: MediaStream | null = null;
  try {
    if (!deviceId) throw new Error("カメラが見つかりません");
    stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
  } catch (e) {
    console.warn("外付け指定で失敗 → フォールバックで起動します:", e);
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  // video に接続してロード完了を待つ
  video.srcObject = stream!;
  await video.play();
  await new Promise<void>(resolve => {
    if (video.readyState >= 2 && video.videoWidth > 0) return resolve();
    const onLoaded = () => {
      video.removeEventListener("loadeddata", onLoaded);
      resolve();
    };
    video.addEventListener("loadeddata", onLoaded);
  });

  // サイズ0対策（MediaPipeに渡す前に必ずチェック）
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("カメラは起動しましたが映像サイズが0です（別アプリが占有していないか確認）");
  }

  // 次回も同じカメラを使う
  const activeTrack = (video.srcObject as MediaStream)
    .getVideoTracks()[0];
  const settings = activeTrack.getSettings();
  if (settings.deviceId) {
    localStorage.setItem("preferredCameraId", settings.deviceId);
  }

  return { stream: stream!, deviceId: settings.deviceId || deviceId };
}

/** デモUI（不要ならこのコンポーネントは丸ごと削ってOK） */
export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let stopped = false;

    (async () => {
      try {
        setMsg("カメラ起動中…（外付け優先）");
        if (!videoRef.current) return;
        const { deviceId } = await openPreferredCamera(videoRef.current);
        if (stopped) return;
        setMsg(`OK: deviceId=${(deviceId || "").slice(0, 8)}… で起動しました`);
      } catch (e: any) {
        setMsg(`エラー: ${e?.message || String(e)}`);
      }
    })();

    return () => {
      stopped = true;
      const s = videoRef.current?.srcObject as MediaStream | null;
      s?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-xl font-bold mb-2">外付けカメラで起動</h1>
      <p className="text-sm mb-3">{msg}</p>
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full max-w-2xl aspect-video bg-black rounded"
      />
    </main>
  );
}
