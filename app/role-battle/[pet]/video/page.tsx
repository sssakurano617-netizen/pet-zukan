// app/role-battle/[pet]/video/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";

const SUPPORTED = ["dog", "cat", "rabbit"] as const;
type PetKey = (typeof SUPPORTED)[number];

export default function VideoPage({ params }: { params: { pet?: string } }) {
  const pet = params.pet as PetKey | undefined;
  if (!pet || !SUPPORTED.includes(pet)) notFound();

  return (
    <main className="relative min-h-screen">
      {/* 背景画像だけ表示 */}
      <Image
        src="/images/background.jpg"
        alt="背景"
        fill
        priority
        className="object-contain -z-10"
      />
    </main>
  );
}
