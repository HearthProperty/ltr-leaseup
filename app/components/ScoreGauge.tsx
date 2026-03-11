'use client';

import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;        // 1–10
  label: string;        // Critical | High | Moderate | Low
}

const URGENCY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Moderate: '#eab308',
  Low: '#22c55e',
};

export default function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = URGENCY_COLORS[label] || '#d4a853';

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG arc math
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = animatedScore / 10;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="score-gauge" id="score-gauge">
      <div className="score-gauge__ring">
        <svg viewBox="0 0 100 100" className="score-gauge__svg">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(168, 176, 192, 0.1)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        </svg>
        <div className="score-gauge__value">
          <span className="score-gauge__number" style={{ color }}>
            {animatedScore}
          </span>
          <span className="score-gauge__max">/10</span>
        </div>
      </div>
      <div className="score-gauge__label" style={{ color }}>
        {label} Urgency
      </div>
    </div>
  );
}
