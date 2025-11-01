// app/layout.tsx
"use client";
import "./globals.css";
import MotionController from "./providers/MotionController";
import IdleAutoReload from "./providers/IdleAutoReload"; // ★ 追加
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== "/";

  return (
    <html lang="ja">
      <body className="min-h-screen">
        {/* ★ 無操作3分（180,000ms）でだけ自動リロード */}
        <IdleAutoReload idleMs={80 * 60 * 1000} enabled />

        {showNav && (
          <header
            className="fixed top-0 left-0 right-0 z-[10000] bg-gray-900/90 text-white backdrop-blur
                       border-b border-white/10"
          >
            <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
              <Link href="/" className="hover:underline" data-clickable="true">ホーム</Link>
              <Link href="/post" className="hover:underline" data-clickable="true">投稿</Link>
              <Link href="/zukan" className="hover:underline" data-clickable="true">図鑑</Link>
             <Link href="/role-battle" className="hover:underline" data-clickable="true">
  役割対決
</Link>

            </nav>
          </header>
        )}

        <main className={showNav ? "pt-16" : ""}>{children}</main>

        <MotionController />
      </body>
    </html>
  );
}
