import React from 'react';

export interface CapsuleItem {
  id: string;
  label: string;
  code: string;
  value: number; // percentage (0 - 100)
  displayValue?: string;
}

interface CapsuleColumnsProps {
  items: CapsuleItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
  className?: string;
}

export const CapsuleColumns: React.FC<CapsuleColumnsProps> = ({
  items,
  selectedId,
  onSelect,
  height = 140,
  className = '',
}) => {
  const maxValue = Math.max(...items.map((it) => it.value), 1);

  return (
    <div className={`flex items-end justify-between gap-3 w-full ${className}`}>
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const fillHeightPercent = Math.max(8, Math.min(100, (item.value / maxValue) * 100));

        return (
          <div
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer group"
          >
            {/* Pill Track */}
            <div
              style={{ height: `${height}px` }}
              className="relative w-[22px] sm:w-[26px] rounded-full bg-black/30 border border-white/10 flex items-end p-[2px] overflow-hidden"
            >
              {/* Inner Fill */}
              <div
                style={{
                  height: `${fillHeightPercent}%`,
                  backgroundColor: isSelected ? '#E8FF1F' : 'rgba(255, 255, 255, 0.9)',
                }}
                className={`w-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isSelected ? 'shadow-[0_0_14px_rgba(232,255,31,0.6)]' : 'group-hover:bg-white'
                }`}
              />
            </div>

            {/* Label Underneath */}
            <span
              className={`text-[11px] font-mono-num font-semibold uppercase tracking-wider transition-colors ${
                isSelected ? 'text-[#E8FF1F]' : 'text-white/60 group-hover:text-white'
              }`}
            >
              {item.code}
            </span>
            <span className="text-[10px] font-mono-num text-white/40">
              {item.displayValue || `${item.value.toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
};
