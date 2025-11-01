// app/components/Nav.tsx
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex gap-4 p-4 border-b">
      <Link href="/mypage">マイページ</Link>
      <Link href="/zukan">図鑑</Link>
      <Link href="/taiketsu" className="font-semibold">役割対決</Link>
    </nav>
  );
}
