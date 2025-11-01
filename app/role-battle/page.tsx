// app/role-battle/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

const PETS = [
  { key: "dog", label: "犬で対決", img: "/images/dog-card.jpg" },
  { key: "cat", label: "猫で対決", img: "/images/cat-card.jpg" },
];

export default function RoleBattleHome() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-8 bg-white">
      <h1 className="text-2xl font-bold mb-8">ペットの種類を選んで対決スタート</h1>

      {/* 犬・猫を中央に横並び */}
      <div className="flex items-center justify-center gap-12">
        {PETS.map((p) => (
          <Link key={p.key} href={`/role-battle/${p.key}/battle`} className="block group">
            <div className="cursor-pointer transform group-hover:scale-105 transition">
              <Image
                src={p.img}
                alt={p.label}
                width={250}
                height={350}
                className="rounded-xl shadow-xl object-cover"
                priority={p.key === "dog"}
              />
            </div>
            <p className="mt-2 text-center text-sm text-gray-700">{p.label}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
