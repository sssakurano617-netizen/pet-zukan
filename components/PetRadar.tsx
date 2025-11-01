

// components/PetRadar.tsx
"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { featuresToRadarScores, toChartData } from "../lib/scoring";

type Props = {
  features: string[]; // ペットの特徴ワード配列
  title?: string;
};

export default function PetRadar({ features, title = "特徴レーダー" }: Props) {
  // 特徴 → スコア → グラフ用データ
  const chartData = toChartData(featuresToRadarScores(features));

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-gray-600">{title}</div>
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 5]} />
            <Tooltip />
            <Radar name="score" dataKey="A" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
