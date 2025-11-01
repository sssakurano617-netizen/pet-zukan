// Prismaをimportしない純粋な型だけ
export type Pet = {
  id: number;
  species: string;
  name: string;
  role: string;
  comment: string;
  emoji?: string;
};
