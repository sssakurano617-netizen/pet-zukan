// app/debug/public/page.tsx  ← サーバーコンポーネント（"use client" は絶対に付けない）
import fs from "fs";
import path from "path";

export default function DebugPublic() {
  const root = process.cwd();
  const pub = path.join(root, "public");
  const sounds = path.join(pub, "sounds");

  const hasPublic = fs.existsSync(pub);
  const hasSounds = fs.existsSync(sounds);
  const files = hasSounds ? fs.readdirSync(sounds) : [];

  const clickPath = path.join(sounds, "click3.mp3");
  const successPath = path.join(sounds, "success8.mp3");
  const hasClick = fs.existsSync(clickPath);
  const hasSuccess = fs.existsSync(successPath);

  return (
    <pre style={{ padding: 16, whiteSpace: "pre-wrap" }}>
{JSON.stringify(
  {
    cwd: root,
    publicDirExists: hasPublic,
    publicDir: pub,
    soundsDirExists: hasSounds,
    soundsDir: sounds,
    filesInSounds: files,
    click3Exists: hasClick,
    success8Exists: hasSuccess,
    testURLs: {
      click3: "/sounds/click3.mp3",
      success8: "/sounds/success8.mp3",
    },
  },
  null,
  2
)}
    </pre>
  );
}
