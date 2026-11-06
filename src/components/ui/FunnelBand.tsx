import React, { useState } from 'react';

export interface FunnelStage {
  name: string;
  shortName: string;
  value: number; // probability (0 - 100)
}

interface StageTrendChartProps {
  stages: FunnelStage[];
  teamName: string;
  className?: string;
}

export const FunnelBand: React.FC<StageTrendChartProps> = ({
  stages,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const W = 740;
  const H = 190;
  const paddingX = 55;
  const topY = 32;
  const bottomY = 148;
  const plotHeight = bottomY - topY; // 116px
  const n = stages.length;

  const getX = (i: number) => paddingX + (i / (n - 1)) * (W - paddingX * 2);
  const getY = (val: number) => bottomY - (Math.max(0, Math.min(100, val)) / 100) * plotHeight;

  const points: [number, number][] = stages.map((st, i) => [getX(i), getY(st.value)]);

  // Smooth Catmull-Rom / cubic bezier curve
  const makeSmoothLine = (pts: [number, number][]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    const k = 0.18;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1[0] + (p2[0] - p0[0]) * k;
      const cp1y = p1[1] + (p2[1] - p0[1]) * k;
      const cp2x = p2[0] - (p3[0] - p1[0]) * k;
      const cp2y = p2[1] - (p3[1] - p1[1]) * k;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };

  const linePath = makeSmoothLine(points);
  const areaPath = `${linePath} L ${points[points.length - 1][0]},${bottomY} L ${points[0][0]},${bottomY} Z`;

  // Horizontal reference grid lines (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className={`relative w-full h-[180px] sm:h-[195px] select-none ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Subtle Area Fill Gradient */}
          <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#A9B2FF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#05082a" stopOpacity="0.0" />
          </linearGradient>

          {/* Stroke Glow Filter */}
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Horizontal Baseline and Grid Lines */}
        {gridLevels.map((lvl) => {
          const y = getY(lvl);
          return (
            <g key={lvl} opacity={0.35}>
              <line
                x1={paddingX - 15}
                y1={y}
                x2={W - paddingX + 15}
                y2={y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeDasharray={lvl === 100 ? undefined : '3 4'}
                strokeWidth={lvl === 100 ? 1 : 0.8}
              />
              <text
                x={paddingX - 22}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9"
                fontWeight="500"
                fill="rgba(255, 255, 255, 0.35)"
                fontFamily="Geist Mono"
              >
                {lvl}%
              </text>
            </g>
          );
        })}

        {/* Area Fill */}
        <path
          d={areaPath}
          fill="url(#trendAreaGrad)"
          className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        />

        {/* Main Trend Line Curve */}
        <path
          d={linePath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lineGlow)"
          className="transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        />

        {/* Interactive Data Points and Labels */}
        {stages.map((st, i) => {
          const [x, y] = points[i];
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={st.name}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Vertical Guide Line */}
              <line
                x1={x}
                y1={y + 6}
                x2={x}
                y2={bottomY}
                stroke={isHovered ? 'rgba(232, 255, 31, 0.5)' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isHovered ? 1.5 : 1}
                strokeDasharray="2 3"
              />

              {/* Data Point Dot */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6.5 : 4.5}
                fill={isHovered ? '#E8FF1F' : '#ffffff'}
                stroke="#0b0b0c"
                strokeWidth="2.2"
                className="transition-all duration-200"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 8px rgba(232, 255, 31, 0.8))' : 'none',
                }}
              />

              {/* Value Pill Above Point */}
              <rect
                x={x - 28}
                y={Math.max(6, y - 24)}
                width="56"
                height="19"
                rx="9.5"
                fill="#000000"
                stroke={isHovered ? '#E8FF1F' : 'rgba(255, 255, 255, 0.18)'}
                strokeWidth={isHovered ? 1.2 : 0.8}
                className="transition-all duration-200"
              />
              <text
                x={x}
                y={Math.max(6, y - 24) + 13}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill={isHovered ? '#E8FF1F' : '#ffffff'}
                fontFamily="Geist Mono"
              >
                {st.value.toFixed(1)}%
              </text>

              {/* Stage Name Pill Below Baseline */}
              <rect
                x={x - 32}
                y={bottomY + 8}
                width="64"
                height="20"
                rx="10"
                fill="#000000"
                stroke={isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth="0.8"
                className="transition-all duration-200"
              />
              <text
                x={x}
                y={bottomY + 22}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight={isHovered ? '600' : '500'}
                fill={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'}
                fontFamily="Geist"
              >
                {st.shortName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
