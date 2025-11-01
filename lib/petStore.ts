// lib/petStore.ts
"use client";

export type Pet = {
  id: string;
  species: string;   // 例: "猫" | "犬" など
  name: string;
  role: string;
  comment: string;
  emoji?: string;
  features?: string[];
  createdAt: string;
};

const STORAGE_KEY = "myPets:v1";

function load(): Pet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Pet[]) : [];
  } catch {
    return [];
  }
}

function save(list: Pet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  // 同一タブ即時反映用
  window.dispatchEvent(new Event("pets:updated"));
}

export const petStore = {
  all(): Pet[] {
    return load();
  },
  add(pet: Omit<Pet, "id" | "createdAt">): Pet {
    const now = new Date().toISOString();
    const newPet: Pet = {
      id: (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      createdAt: now,
      ...pet,
    };
    const list = load();
    save([newPet, ...list]);
    return newPet;
  },
  remove(id: string) {
    const list = load().filter((p) => p.id !== id);
    save(list);
  },
  clear() {
    save([]);
  },
  /** 変更監視（同一タブ＆別タブ両方に対応） */
  subscribe(cb: (pets: Pet[]) => void) {
    const onLocal = () => cb(load());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) onLocal();
    };
    window.addEventListener("pets:updated", onLocal);
    window.addEventListener("storage", onStorage);
    // 初期発火
    cb(load());
    return () => {
      window.removeEventListener("pets:updated", onLocal);
      window.removeEventListener("storage", onStorage);
    };
  },
};
