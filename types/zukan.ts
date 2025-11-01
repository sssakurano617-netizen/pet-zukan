// types/zukan.ts
export type ZukanItem = {
  id: string;
  title: string;
  // 必要に応じて項目を追加してください
  // imageUrl?: string | null;
  // description?: string;
};

export type ZukanDetail = ZukanItem & {
  // 詳細だけの追加項目があればここへ
  // roles?: string[];
};
