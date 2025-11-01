// app/components/RoleCard.tsx
"use client";

import Image from "next/image";

const FRONT_IMAGE: Record<"dog" | "cat" | "rabbit", string> = {
  dog: "/images/card-front-dog.jpg",
  cat: "/images/card-front-cat.jpg",
  rabbit: "/images/card-front-rabbit.jpg",
};

type Props = {
  species: "dog" | "cat" | "rabbit";
  role: string;
  comment: string;
  size?: "sm" | "md" | "lg";
  variant?: "battle" | "final";
  className?: string;
  /** 役割タイトル＋コメントのテキストブロックを下方向へ移動（px）。デフォルト 0 */
  contentOffsetY?: number;
};

export default function RoleCard({
  species,
  role,
  comment,
  size = "md",
  variant = "battle",
  className = "",
  contentOffsetY = 0,
}: Props) {
  const sizeClass =
    size === "sm"
      ? "w-[260px] md:w-[280px]"
      : size === "lg"
      ? "w-[360px] md:w-[420px]"
      : "w-[320px] md:w-[360px]";

  // 用途別レイアウト（/ready の二択は battle、最後の三択は final）
  // 👉 文字配列は全ペット共通化：左右のパディング差を撤廃＆中央揃えに
  const cfg =
    variant === "battle"
      ? {
          padTop: "pt-[160px] md:pt-[180px]", // 少し上目（犬と猫で共通）
          commentMt: "mt-6",
          wrapWidth: size === "sm" ? 12 : 15, // 改行幅はサイズのみで統一
        }
      : {
          padTop:
            size === "sm"
              ? "pt-[110px] md:pt-[140px]"
              : "pt-[120px] md:pt-[136px]",
          commentMt: "mt-3",
          wrapWidth: size === "sm" ? 12 : 15,
        };

  return (
    <div className={`relative ${sizeClass} aspect-[3/4] ${className}`}>
      <Image
        src={FRONT_IMAGE[species]}
        alt={`${species} card`}
        fill
        priority
        className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
      />

      <div className={`absolute inset-0 flex flex-col items-center px-6 ${cfg.padTop} pb-10`}>
        {/* 役割＋コメントのテキストブロック（ここだけ縦位置を下げる） */}
        <div
          style={{ transform: `translateY(${contentOffsetY}px)` }}
          className="w-full"
        >
          {/* 役割（中央揃えで統一） */}
          <div className="w-full text-center text-white font-extrabold text-xl md:text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
            {role}
          </div>

          {/* コメント：中央揃え・左右パディング差なしで統一 */}
          <div
            className={`${cfg.commentMt} w-full text-center text-white text-sm leading-relaxed whitespace-pre-wrap break-words drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]`}
          >
            {wrapJaKinsoku(comment, cfg.wrapWidth)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 日本語用の禁則付き改行。
 * - 1行あたり width 文字
 * - 行頭禁止文字（句読点や閉じ括弧）は前の行にくっつける
 * - 行末禁止文字（開き括弧や一文字助詞）は次の行に送る
 */
function wrapJaKinsoku(text: string, width = 15) {
  if (!text) return "";

  const NO_LEADING = new Set([
    "、","。","，","．",",",".","!","！","?","？",
    "：",":","；",";","・","ー","〜",
    "」","』","）","］","｝","】","》","〉","〙","〗","〕",")","]","}",
  ]);

  const NO_TRAILING = new Set([
    "「","『","（","［","｛","【","《","〈","“","(" ,"[","{",
    "・","ー","〜",
    "は","が","を","に","へ","で","と","も","や","の",
  ]);

  const chars = Array.from(text);
  const lines: string[] = [];
  let i = 0;

  while (i < chars.length) {
    let end = Math.min(i + width, chars.length);

    // 行頭禁止 → 前にくっつける
    while (end < chars.length && NO_LEADING.has(chars[end])) end++;

    // 行末禁止 → 1つ戻す
    while (end > i && NO_TRAILING.has(chars[end - 1])) end--;

    if (end <= i) end = Math.min(i + width, chars.length);

    lines.push(chars.slice(i, end).join(""));
    i = end;
  }
  return lines.join("\n");
}
