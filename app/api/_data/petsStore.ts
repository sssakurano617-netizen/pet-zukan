// app/api/_data/petsStore.ts
import type { Pet } from "@/lib/pets";

// デモ用インメモリ（開発サーバー再起動でリセットされます）
let PETS: Pet[] = [
  { id: 1, species: "ラボット", name: "こむぎ", role: "おやつ欲しい",
    comment: "生きているように感じる。結構抱っこして可愛がっている。", ownerInitials: "YN", emoji: "🐾" },
  { id: 2, species: "熱帯魚", name: "ネオンテトラ", role: "“間 ” 担当",
    comment: "落ち着くための気持ち作り", ownerInitials: "KM", emoji: "🐟" },
  { id: 3, species: "ラボット", name: "ぽぽ", role: "監視",
    comment: "生きているように感じる。結構抱っこして可愛がっている", ownerInitials: "AB", emoji: "🐾" },
];

export const petsStore = {
  list: () => PETS,
  add: (pet: Pet) => { PETS.push(pet); },
  find: (id: number) => PETS.find(p => p.id === id),
  replaceAll: (next: Pet[]) => { PETS = next; },
};
