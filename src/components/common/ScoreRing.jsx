import React from 'react';
import './ScoreRing.css';

// Gradient stops:
// 0.0 -> #D62828 (214, 40, 40)
// 2.5 -> #F77F00 (247, 127, 0)
// 5.0 -> #F4D35E (244, 211, 94)
// 7.5 -> #90BE6D (144, 190, 109)
// 10.0 -> #2DC653 (45, 198, 83)
const COLOR_STOPS = [
  { score: 0.0, rgb: [214, 40, 40] },
  { score: 2.5, rgb: [247, 127, 0] },
  { score: 5.0, rgb: [244, 211, 94] },
  { score: 7.5, rgb: [144, 190, 109] },
  { score: 10.0, rgb: [45, 198, 83] }
];

export function getScoreRgb(score) {
  const clamped = Math.max(0, Math.min(10, Number(score) || 0));

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const s1 = COLOR_STOPS[i];
    const s2 = COLOR_STOPS[i + 1];

    if (clamped >= s1.score && clamped <= s2.score) {
      const t = (clamped - s1.score) / (s2.score - s1.score);
      const r = Math.round(s1.rgb[0] + (s2.rgb[0] - s1.rgb[0]) * t);
      const g = Math.round(s1.rgb[1] + (s2.rgb[1] - s1.rgb[1]) * t);
      const b = Math.round(s1.rgb[2] + (s2.rgb[2] - s1.rgb[2]) * t);
      return [r, g, b];
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1].rgb;
}

export function ScoreRing({ score = 10.0, size = 48, onClick, className = '' }) {
  const numericScore = Number(score) || 0;
  const [r, g, b] = getScoreRgb(numericScore);
  const colorRgb = `rgb(${r}, ${g}, ${b})`;
  const glowShadow = `drop-shadow(0 0 6px rgba(${r}, ${g}, ${b}, 0.4)) drop-shadow(0 0 10px rgba(${r}, ${g}, ${b}, 0.25))`;

  let strokeWidth = 4;
  let fontSize = '11px';
  let showScale = false;

  if (size >= 120) {
    strokeWidth = 8;
    fontSize = 'var(--text-xl)';
    showScale = true;
  } else if (size >= 90) {
    strokeWidth = 7;
    fontSize = 'var(--text-lg)';
    showScale = true;
  } else {
    // 48px
    strokeWidth = 4.5;
    fontSize = '12px';
    showScale = false;
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillFraction = Math.max(0, Math.min(numericScore / 10, 1));
  const dashoffset = circumference * (1 - fillFraction);
  const center = size / 2;

  return (
    <div
      className={`score-ring-container ${onClick ? 'clickable' : ''} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={onClick}
      title={`Trust Score: ${numericScore.toFixed(1)} / 10.0`}
    >
      <svg
        className="score-ring-svg"
        width={size}
        height={size}
        style={{ filter: glowShadow }}
      >
        {/* Background track circle */}
        <circle
          className="score-ring-bg-track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Foreground dynamic arc */}
        <circle
          className="score-ring-progress"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={colorRgb}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="score-ring-content">
        <span className="score-ring-value" style={{ fontSize }}>
          {numericScore.toFixed(1)}
        </span>
        {showScale && <span className="score-ring-scale">/ 10</span>}
      </div>
    </div>
  );
}
