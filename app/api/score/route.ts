// app/api/score/route.ts
import { NextResponse } from "next/server";
import { readStats } from "../role-stats/store";

// Wilson score lower bound (95%)
function wilsonLower(w: number, n: number, z = 1.96) {
  if (!n) return 0;
  const p = w / n;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return (center - margin) / denom;
}

export async function POST(req: Request) {
  try {
    const { keys } = (await req.json()) as { keys?: string[] };
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "no keys" }, { status: 400 });
    }

    const stats = await readStats();
    const result = keys.map((k) => {
      const s = stats[k] || { exposures: 0, wins: 0 };
      const rate = s.exposures ? s.wins / s.exposures : 0;
      const meter = wilsonLower(s.wins, s.exposures);
      return { key: k, exposures: s.exposures, wins: s.wins, rate, meter };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
