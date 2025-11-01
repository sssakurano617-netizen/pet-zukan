// lib/scoring.ts

// レーダーチャート用のスコア型
export type RadarScores = {
  コミュニケーション: number;
  安心感: number;
  遊び心: number;
  生活サポート: number;
  生活リズム: number;
};

// 特徴ワード配列 → スコアに変換
export function featuresToRadarScores(features: string[]): RadarScores {
  const scores: RadarScores = {
    コミュニケーション: 0,
    安心感: 0,
    遊び心: 0,
    生活サポート: 0,
    生活リズム: 0,
  };

  for (const f of features) {
    if (f.includes("会話") || f.includes("一緒") || f.includes("寄り添")) {
      scores.コミュニケーション += 2;
    }
    if (f.includes("安心") || f.includes("癒し") || f.includes("やさし")) {
      scores.安心感 += 2;
    }
    if (f.includes("遊び") || f.includes("元気") || f.includes("楽しい")) {
      scores.遊び心 += 2;
    }
    if (f.includes("手伝") || f.includes("サポート") || f.includes("見守り")) {
      scores.生活サポート += 2;
    }
    if (
      f.includes("健康") ||
      f.includes("運動") ||
      f.includes("起床") ||
      f.includes("生活")
    ) {
      scores.生活リズム += 2;
    }
  }

  return scores;
}

// Recharts に渡す配列型
export type RadarAxisKey = { subject: string; A: number };

// スコア → Recharts の data 形式に変換
export function toChartData(scores: RadarScores): RadarAxisKey[] {
  return [
    { subject: "コミュニケーション", A: scores.コミュニケーション },
    { subject: "安心感", A: scores.安心感 },
    { subject: "遊び心", A: scores.遊び心 },
    { subject: "生活サポート", A: scores.生活サポート },
    { subject: "生活リズム", A: scores.生活リズム },
  ];
}
