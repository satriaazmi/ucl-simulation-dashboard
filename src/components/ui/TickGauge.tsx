import React, { useState } from 'react';

interface TickGaugeProps {
  totalClubs?: number;
  top8Count?: number;
  playoffCount?: number;
  elimCount?: number;
  hoveredClub?: string | null;
  onHoverClub?: (info: { team: string; rank: number; x: number; y: number } | null) => void;
  teamsOrdered?: string[];
  className?: string;
}

export const TickGauge: React.FC<TickGaugeProps> = ({
  totalClubs = 36,
  top8Count = 8,
  playoffCount = 16,
  hoveredClub = null,
  teamsOrdered = [],
  className = '',
}) => {
  const [activeTick, setActiveTick] = useState<number | null>(null);

  // 36 ticks spanning 180 degrees (from 180 deg to 360/0 deg)
  const ticks = [];
  const rOuter = 136;

  for (let i = 0; i < totalClubs; i++) {
    const fraction = i / (totalClubs - 1);
    const angleDeg = 180 + fraction * 180;
    const angleRad = (angleDeg * Math.PI) / 180;

    const isMajor = i % 7 === 0 || i === top8Count - 1 || i === top8Count + playoffCount - 1;
    const rInner = isMajor ? 112 : 118;

    const x1 = rOuter * Math.cos(angleRad);
    const y1 = rOuter * Math.sin(angleRad);
    const x2 = rInner * Math.cos(angleRad);
    const y2 = rInner * Math.sin(angleRad);

    let color = '#EF4444'; // Elimination
    let zone = 'Eliminasi';
    if (i < top8Count) {
      color = '#10B981'; // Top 8
      zone = 'Top 8';
    } else if (i < top8Count + playoffCount) {
      color = '#60A5FA'; // Playoff
      zone = 'Playoff';
    }

    const teamName = teamsOrdered[i] || `Peringkat ${i + 1}`;
    const isHovered = activeTick === i || (hoveredClub && hoveredClub === teamName);

    ticks.push({
      index: i,
      x1,
      y1,
      x2,
      y2,
      color,
      zone,
      teamName,
      isHovered,
    });
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width="300"
        height="168"
        viewBox="-150 -150 300 168"
        className="overflow-visible"
        aria-hidden="true"
      >
        {ticks.map((t) => (
          <line
            key={t.index}
            x1={t.x1.toFixed(1)}
            y1={t.y1.toFixed(1)}
            x2={t.x2.toFixed(1)}
            y2={t.y2.toFixed(1)}
            stroke={t.color}
            strokeWidth={t.isHovered ? 4.5 : 3.2}
            strokeLinecap="round"
            className="cursor-pointer transition-all duration-200"
            style={{
              opacity: t.isHovered ? 1.0 : 0.85,
              filter: t.isHovered ? 'drop-shadow(0 0 6px currentColor)' : 'none',
            }}
            onMouseEnter={() => setActiveTick(t.index)}
            onMouseLeave={() => setActiveTick(null)}
          >
            <title>{`${t.teamName} (#${t.index + 1}) · Zona ${t.zone}`}</title>
          </line>
        ))}

        {/* Center Numbers */}
        <text
          y="-20"
          textAnchor="middle"
          fontFamily="Geist"
          fontWeight="200"
          fontSize="52"
          fill="#ffffff"
          letterSpacing="-2"
        >
          {totalClubs}
        </text>
        <text
          y="6"
          textAnchor="middle"
          fontSize="12"
          fontWeight="500"
          fill="rgba(255,255,255,0.38)"
          fontFamily="Geist"
        >
          {activeTick !== null && teamsOrdered[activeTick]
            ? `#${activeTick + 1} ${teamsOrdered[activeTick]}`
            : 'klub peserta'}
        </text>
      </svg>
    </div>
  );
};
