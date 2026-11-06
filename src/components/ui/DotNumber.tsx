import React, { useState, useEffect, useRef, useMemo } from 'react';

// Font dot matrix 5x7
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '%': ['11001', '11010', '00100', '01000', '01011', '10011', '00000'],
  ',': ['0', '0', '0', '0', '0', '1', '1'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
  '#': ['01010', '11111', '01010', '01010', '11111', '01010', '00000'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'S': ['01111', '10000', '11110', '00001', '00001', '10001', '01110'],
};

interface DotNumberProps {
  value: string;
  pitch?: number;
  className?: string;
  color?: string;
}

export const DotNumber: React.FC<DotNumberProps> = ({
  value,
  pitch = 7,
  className = '',
  color = '#ffffff',
}) => {
  const [displayVal, setDisplayVal] = useState<string>(value);
  const rafRef = useRef<number | null>(null);

  // Count-up 900ms with ease-out-cubic
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    const match = value.match(/([\d]+(?:[.,]\d+)?)/);
    if (!match) return;

    const numStr = match[1].replace(',', '.');
    const targetNum = parseFloat(numStr);
    if (Number.isNaN(targetNum)) return;

    const isComma = match[1].includes(',');
    const decimals = match[1].includes(',')
      ? match[1].split(',')[1].length
      : match[1].includes('.')
        ? match[1].split('.')[1].length
        : 0;

    const prefix = value.slice(0, match.index ?? 0);
    const suffix = value.slice((match.index ?? 0) + match[1].length);

    const duration = 900;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out-cubic: 1 - (1 - p)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * ease;

      const formatted = isComma
        ? current.toFixed(decimals).replace('.', ',')
        : current.toFixed(decimals);

      setDisplayVal(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayVal(value);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value]);

  const { dots, width, height } = useMemo(() => {
    const text = String(displayVal);
    const activeCoords = new Set<string>();
    let currentX = 0;

    for (let charIdx = 0; charIdx < text.length; charIdx++) {
      const ch = text[charIdx];
      const matrix = GLYPHS[ch] || GLYPHS[' '];
      const charWidth = matrix[0].length;

      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < charWidth; c++) {
          if (matrix[r][c] === '1') {
            activeCoords.add(`${currentX + c},${r}`);
          }
        }
      }
      currentX += charWidth + 1; // 1 dot gap
    }

    const totalCols = Math.max(1, currentX - 1);
    const svgWidth = totalCols * pitch;
    const svgHeight = 7 * pitch;

    const circles = [];
    for (let col = 0; col < totalCols; col++) {
      for (let row = 0; row < 7; row++) {
        const isActive = activeCoords.has(`${col},${row}`);
        circles.push({
          cx: col * pitch + pitch / 2,
          cy: row * pitch + pitch / 2,
          r: pitch * 0.36,
          opacity: isActive ? 1.0 : 0.08,
          scale: isActive ? 1.0 : 0.55,
          key: `${col}-${row}`,
        });
      }
    }

    return { dots: circles, width: svgWidth, height: svgHeight };
  }, [displayVal, pitch]);

  return (
    <div className={`inline-flex items-center max-w-full ${className}`} aria-label={value}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto select-none"
        style={{ maxWidth: '100%', height: 'auto', maxHeight: `${height}px` }}
      >
        {dots.map((d) => (
          <circle
            key={d.key}
            cx={d.cx}
            cy={d.cy}
            r={d.r * d.scale}
            fill={color}
            opacity={d.opacity}
            style={{
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              transformOrigin: `${d.cx}px ${d.cy}px`,
            }}
          />
        ))}
      </svg>
    </div>
  );
};
