// app/api/pets/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await prisma.pet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
