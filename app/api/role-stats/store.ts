// app/api/role-stats/store.ts
import { promises as fs } from "fs";
import path from "path";

/** 保存先のファイルパス */
const FILE = path.join(process.cwd(), "data", "roleStats.json");

/** 集計データの型 */
export type RoleStats = Record<
  string,
  {
    exposures: number; // 表示された回数
    wins: number;      // 勝った回数
  }
>;

/** ファイルが存在しなければ空の JSON を作成 */
async function ensureFile() {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify({}), "utf-8");
  }
}

/** 集計データを読み込み */
export async function readStats(): Promise<RoleStats> {
  await ensureFile();
  const txt = await fs.readFile(FILE, "utf-8");
  return JSON.parse(txt || "{}");
}

/** 集計データを書き込み */
export async function writeStats(data: RoleStats) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(data), "utf-8");
}
