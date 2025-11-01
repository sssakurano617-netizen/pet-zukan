// app/taiketsu/roles.ts
export type RoleItem = {
  id: string;
  pet: "猫" | "犬" | "うさぎ" | "ハムスター" | "鳥" | "その他";
  role: string;              // 役割名（係）
  notes?: string;            // 補足・エピソード
  tags?: Array<"意外" | "おもしろい" | "人の役に立つ">; // その役割が当てはまりやすいジャンル
};

export const ROLE_POOL: RoleItem[] = [
  { id: "c1", pet: "猫", role: "朝の目覚まし係", tags: ["人の役に立つ"] },
  { id: "d1", pet: "犬", role: "宅配の到着アラート係", tags: ["意外","人の役に立つ"] },
  { id: "h1", pet: "ハムスター", role: "深夜見守り（回し車夜勤）", tags: ["おもしろい"] },
  { id: "b1", pet: "鳥", role: "家族会議の司会（鳴きで参加）", tags: ["おもしろい","意外"] },
  { id: "r1", pet: "うさぎ", role: "静寂チェック係（音に敏感）", tags: ["意外"] },
  // …ここにどんどん追記
];
