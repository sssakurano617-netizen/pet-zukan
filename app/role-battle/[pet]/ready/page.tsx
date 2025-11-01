// app/role-battle/[pet]/ready/page.tsx
"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect } from "react";
import BattlePair from "@/components/BattlePair";

const SUPPORTED = ["dog", "cat", "rabbit"] as const;
type PetKey = (typeof SUPPORTED)[number];

export default function ReadyPage({ params }: { params: { pet?: string } }) {
  const pet = params.pet as PetKey | undefined;
  if (!pet || !SUPPORTED.includes(pet)) notFound();

  const router = useRouter();

  // 🐾 肉球検出イベントを受け取る
  useEffect(() => {
    const handler = () => {
      router.push(`/role-battle/${pet}/boss`);
    };
    window.addEventListener("paw-detected", handler);
    return () => window.removeEventListener("paw-detected", handler);
  }, [pet, router]);

  return (
    <main className="min-h-[100dvh] bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:pt-8 space-y-6">
        <BattlePair species={pet} />
      </div>
    </main>
  );
}
