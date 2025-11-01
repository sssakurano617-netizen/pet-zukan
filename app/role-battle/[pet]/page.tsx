// app/role-battle/[pet]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SUPPORTED = ["dog", "cat", "rabbit"] as const;
type PetKey = (typeof SUPPORTED)[number];

export default function PetPage({ params }: { params: { pet?: string } }) {
  const pet = params.pet as PetKey | undefined;
  if (!pet || !SUPPORTED.includes(pet)) notFound();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-8">カードを選んで対決スタート</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 犬カード */}
        <Link href="/role-battle/dog/battle" className="block">
          <div className="cursor-pointer transform hover:scale-105 transition">
            <Image
              src="/images/cards/dog-card.jpg"
              alt="犬カード"
              width={250}
              height={350}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </Link>

        {/* 猫カード */}
        <Link href="/role-battle/cat/battle" className="block">
          <div className="cursor-pointer transform hover:scale-105 transition">
            <Image
              src="/images/cards/cat-card.jpg"
              alt="猫カード"
              width={250}
              height={350}
              className="rounded-lg shadow-lg"
            />
          </div>
        </Link>
      </div>

      <p className="mt-4 text-sm text-gray-500">※ 今は犬と猫のみ。うさぎは後日追加予定。</p>
    </main>
  );
}
