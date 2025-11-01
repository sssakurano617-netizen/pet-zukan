// lib/roles.ts

/** 役割を一意に識別するキー */
export type RoleKey = string;

/** species + role を正規化してユニークキー化 */
export function toRoleKey(species: string, role: string): RoleKey {
  return `${species.trim()}:${role.trim()}`.toLowerCase();
}
