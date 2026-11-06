import React from 'react';

interface MirroredWaveProps {
  top8Cdf: number[];
  playoffCdf: number[];
  selectedPoints?: number;
  onSelectPoints?: (pts: number) => void;
  className?: string;
}

export const MirroredWave: React.FC<MirroredWaveProps> = ({
  top8Cdf,
  playoffCdf,
  selectedPoints = 16,
  onSelectPoints,
  className = '',
}) => {
  // Display range for points: 7 to 19
  const minPt = 7;
  const maxPt = 19;
  const ptsRange = Array.from({ length: maxPt - minPt + 1 }, (_, i) => minPt + i);

  const W = 620;
  const H = 200;
  const centerY = 100;
  const maxWaveH = 75;

  const getX = (pt: number) => 40 + ((pt - minPt) / (maxPt - minPt)) * (W - 80);

  // Upper wave: Top 8 security (100 - top8_cdf) or top8_cdf
  // top8_cdf[pt] is probability cutoff_8 <= pt, so with pt points you qualify with probability top8_cdf[pt]!
  const topPoints: [number, number][] = ptsRange.map((pt) => {
    const val = top8Cdf[pt] ?? 0;
    const y = centerY - (val / 100) * maxWaveH;
    return [getX(pt), y];
  });

  // Lower wave: Playoff security
  const botPoints: [number, number][] = ptsRange.map((pt) => {
    const val = playoffCdf[pt] ?? 0;
    const y = centerY + (val / 100) * maxWaveH;
    return [getX(pt), y];
  });

  const makePath = (pts: [number, number][]) => {
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const cx = (p1[0] + p2[0]) / 2;
      d += ` C ${cx},${p1[1]} ${cx},${p2[1]} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const topPath = makePath(topPoints);
  const botPath = makePath(botPoints);

  return (
    <div className={`relative w-full h-[190px] select-none ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffb3d6" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Center line with horizontal hairline */}
        <line
          x1="20"
          y1={centerY}
          x2={W - 20}
          y2={centerY}
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.2"
        />

        {/* Top Wave: Top 8 Ambang */}
        <path
          d={topPath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          className="transition-all duration-300"
        />

        {/* Multi-contour waves behind top */}
        {[0.7, 0.4].map((mult, idx) => {
          const scaledPts: [number, number][] = topPoints.map(([x, y]) => [
            x,
            centerY - (centerY - y) * mult,
          ]);
          return (
            <path
              key={`top-c-${idx}`}
              d={makePath(scaledPts)}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              opacity={0.35 * (idx + 1)}
            />
          );
        })}

        {/* Bottom Wave: Playoff Ambang */}
        <path
          d={botPath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          className="transition-all duration-300"
        />

        {[0.7, 0.4].map((mult, idx) => {
          const scaledPts: [number, number][] = botPoints.map(([x, y]) => [
            x,
            centerY + (y - centerY) * mult,
          ]);
          return (
            <path
              key={`bot-c-${idx}`}
              d={makePath(scaledPts)}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              opacity={0.35 * (idx + 1)}
            />
          );
        })}

        {/* Vertical Guidelines and Points */}
        {ptsRange.map((pt) => {
          const x = getX(pt);
          const isSelected = selectedPoints === pt;

          return (
            <g
              key={pt}
              onClick={() => onSelectPoints?.(pt)}
              className="cursor-pointer group"
            >
              {/* Vertical line on hover / selection */}
              <line
                x1={x}
                y1={20}
                x2={x}
                y2={H - 20}
                stroke={isSelected ? '#E8FF1F' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isSelected ? 1.8 : 1}
                strokeDasharray={isSelected ? undefined : '2 3'}
              />

              {/* Center point circle */}
              <circle
                cx={x}
                cy={centerY}
                r={isSelected ? 6 : 3}
                fill={isSelected ? '#E8FF1F' : 'rgba(255, 255, 255, 0.6)'}
                className="transition-all"
              />

              {/* Point Label */}
              <text
                x={x}
                y={centerY + (pt % 2 === 0 ? -12 : 16)}
                textAnchor="middle"
                fontSize={isSelected ? '12' : '10'}
                fontWeight={isSelected ? '700' : '500'}
                fill={isSelected ? '#E8FF1F' : 'rgba(255, 255, 255, 0.65)'}
                fontFamily="Geist Mono"
              >
                {pt}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
