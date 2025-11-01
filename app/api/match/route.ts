// app/api/match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readStats } from "../role-stats/store";
import { toRoleKey } from "../../../lib/roles";

type Pet = {
  id: number;
  species: string;
  name: string;
  role: string;
  comment: string;
  emoji?: string;
};

type Role = { key: string; species: string; role: string };
type Pair = { a: Role; b: Role };

async function fetchRoles(origin: string): Promise<Role[]> {
  // 実行中のホスト/ポートに合わせる
  const res = await fetch(`${origin}/api/pets`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load pets (${res.status})`);
  const pets: Pet[] = await res.json();

  const seen = new Set<string>();
  const roles: Role[] = [];
  for (const p of pets) {
    if (!p.role?.trim()) continue;
    const key = toRoleKey(p.species, p.role);
    if (!seen.has(key)) {
      seen.add(key);
      roles.push({ key, species: p.species, role: p.role });
    }
  }
  return roles;
}

function pickFairPairs(
  roles: Role[],
  stats: Record<string, { exposures: number; wins: number }>,
  rounds: number
): Pair[] {
  // 露出回数が少ない順（同数はランダム）
  const shuffled = [...roles].sort(() => Math.random() - 0.5);
  const sorted = shuffled.sort(
    (a, b) => (stats[a.key]?.exposures || 0) - (stats[b.key]?.exposures || 0)
  );

  const used = new Set<string>();
  const pairs: Pair[] = [];

  for (const r of sorted) {
    if (pairs.length >= rounds) break;
    if (used.has(r.key)) continue;

    const opponent = sorted.find((x) => x.key !== r.key && !used.has(x.key));
    if (!opponent) continue;

    used.add(r.key);
    used.add(opponent.key);
    pairs.push({ a: r, b: opponent });
  }

  return pairs;
}

export async function GET(req: NextRequest) {
  const roundsParam = req.nextUrl.searchParams.get("rounds");
  const rounds = Math.max(1, Math.min(5, Number(roundsParam) || 3));
  const origin = req.nextUrl.origin; // ← ここが3000/3001/3002など自動で合う

  try {
    const [roles, stats] = await Promise.all([fetchRoles(origin), readStats()]);
    const pairs = pickFairPairs(roles, stats, rounds);
    return NextResponse.json({ pairs });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
