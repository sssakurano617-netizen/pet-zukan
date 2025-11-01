// app/test/page.tsx
"use client";
import { useEffect, useRef } from "react";

export default function TestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    })();
  }, []);

  return (
    <main>
      <h1>カメラテスト</h1>
      <video ref={videoRef} autoPlay playsInline style={{ width: "400px" }} />
    </main>
  );
}
