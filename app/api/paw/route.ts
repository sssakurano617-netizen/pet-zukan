// app/api/paw/route.ts
import { NextResponse } from "next/server";

let detected = false;

export async function GET() {
  return NextResponse.json({ detected });
}

export async function POST() {
  detected = true;
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  detected = false;
  return NextResponse.json({ ok: true });
}
