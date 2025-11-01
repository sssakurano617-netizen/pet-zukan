// lib/useLocalPets.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { petStore, Pet } from "./petStore";

export function useLocalPets() {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    const unsubscribe = petStore.subscribe(setPets);
    return unsubscribe;
  }, []);

  const addPet = useCallback(
    (data: Omit<Pet, "id" | "createdAt">) => petStore.add(data),
    []
  );

  const removePet = useCallback((id: string) => petStore.remove(id), []);
  const clearPets = useCallback(() => petStore.clear(), []);

  return { pets, addPet, removePet, clearPets };
}
