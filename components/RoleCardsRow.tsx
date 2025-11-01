// app/components/RoleCardsRow.tsx
"use client";

type Card = {
  id: number;
  name: string;
  role: string;
  emoji?: string;
};

type Props = {
  left: Card[];
  right: Card[];
};

export default function RoleCardsRow({ left, right }: Props) {
  // 3回分のペアにする（左と右で同じインデックス同士）
  const rounds = Array.from({ length: Math.min(left.length, right.length) }, (_, i) => ({
    left: left[i],
    right: right[i],
  }));

  return (
    <div className="flex flex-col gap-10">
      {rounds.map((pair, idx) => (
        <div
          key={idx}
          className="flex flex-row items-center justify-center gap-8"
        >
          {/* 左カード */}
          <div className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm aspect-[3/4] w-[200px]">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {pair.left.emoji ? `${pair.left.emoji} ${pair.left.name}` : pair.left.name}
              </div>
            </div>
            <div className="mt-3 text-xs opacity-60 text-center">役割</div>
            <div className="mt-1 text-lg font-bold text-center leading-snug">
              {pair.left.role}
            </div>
          </div>

          {/* VS */}
          <div className="text-3xl font-black tracking-wide select-none">VS</div>

          {/* 右カード */}
          <div className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm aspect-[3/4] w-[200px]">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {pair.right.emoji ? `${pair.right.emoji} ${pair.right.name}` : pair.right.name}
              </div>
            </div>
            <div className="mt-3 text-xs opacity-60 text-center">役割</div>
            <div className="mt-1 text-lg font-bold text-center leading-snug">
              {pair.right.role}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
