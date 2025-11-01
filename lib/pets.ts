// lib/pets.ts

/** 公開カードの基本型 */
export type Pet = {
  id: number;
  species: string;       // 例: 猫 / 犬 / 熱帯魚 / うさぎ / ハムスター / 鳥 / ラボット 等
  name: string;
  role: string;
  comment: string;
  ownerInitials: string; // 記入者（飼い主）のイニシャル
  emoji?: string;        // 任意。未設定なら species から自動
};

/** 新規投稿（POST）時に使う型（id はサーバー側で採番） */
export type NewPetInput = Omit<Pet, "id">;

/** 種類 → 絵文字の自動変換 */
export const speciesToEmoji = (species: string) => {
  if (!species) return "🐾";
  if (species.includes("猫")) return "🐈";
  if (species.includes("犬")) return "🐕";
  if (species.includes("魚") || species.includes("熱帯魚")) return "🐟";
  if (species.includes("うさぎ")) return "🐇";
  if (species.includes("ハムスター")) return "🐹";
  if (species.includes("鳥")) return "🦆";
  return "🐾";
};

/** emoji が未指定なら species から補完して返すヘルパー */
export const ensureEmoji = <T extends { species: string; emoji?: string }>(
  pet: T
): T & { emoji: string } => {
  return { ...pet, emoji: pet.emoji && pet.emoji.length > 0 ? pet.emoji : speciesToEmoji(pet.species) };
};
