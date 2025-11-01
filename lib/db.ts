// lib/db.ts
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

// ビルド時に実行されないよう、関数内で動的 import + 遅延初期化
export async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}
