// components/SlidePrompt.tsx
"use client";

type Props = { text: string };

export default function SlidePrompt({ text }: Props) {
  return (
    <div className="relative overflow-hidden">
      <div className="animate-slide-in-left text-3xl font-extrabold tracking-wide">
        {text}
      </div>
    </div>
  );
}
