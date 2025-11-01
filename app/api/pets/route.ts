export const runtime = "nodejs";

import { NextResponse } from "next/server";
// 相対パスで安全に（エイリアスOKなら "@/lib/prisma" でも可）
import { prisma } from "../../../lib/prisma"; // または "@/lib/prisma"


export async function GET() {
  const pets = await prisma.pet.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(pets);
}

export async function POST(req: Request) {
  try {
    const { species, name, role, comment, emoji } = await req.json();

    if (!species || !name || !role || !comment) {
      return NextResponse.json(
        { error: "species, name, role, comment は必須です" },
        { status: 400 }
      );
    }

    const pet = await prisma.pet.create({
      data: { species, name, role, comment, emoji },
    });
    return NextResponse.json(pet, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
