// 表示順や絵文字マップだけ（Prisma禁止）
export const FIXED_ORDER = ["犬","猫","ウサギ","ハムスター","魚","鳥類","その他"] as const;
export type FixedSpecies = (typeof FIXED_ORDER)[number];

export function speciesToEmoji(species: string) {
  const m: Record<string,string> = {
    "犬":"🐶","猫":"🐱","ウサギ":"🐰","ハムスター":"🐹","魚":"🐟","鳥類":"🐦","その他":"🐾"
  };
  return m[species] ?? "🐾";
}
