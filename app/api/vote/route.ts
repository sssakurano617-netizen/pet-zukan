// app/api/vote/route.ts
import { NextResponse } from "next/server";
import { readStats, writeStats } from "../role-stats/store";

export async function POST(req: Request) {
  try {
    const { winner, loser } = (await req.json()) as { winner?: string; loser?: string };
    if (!winner || !loser || winner === loser) {
      return NextResponse.json({ error: "invalid vote" }, { status: 400 });
    }

    const stats = await readStats();

    stats[winner] = stats[winner] || { exposures: 0, wins: 0 };
    stats[loser]  = stats[loser]  || { exposures: 0, wins: 0 };

    // 露出（両方）＋ 勝ち（winner）
    stats[winner].exposures += 1;
    stats[loser].exposures  += 1;
    stats[winner].wins      += 1;

    await writeStats(stats);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
