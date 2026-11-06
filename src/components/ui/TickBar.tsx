import React from 'react';

interface TickBarProps {
  totalTicks?: number;
  activeTicks?: number;
  activeColor?: string;
  inactiveColor?: string;
  majorStep?: number;
  height?: number;
  majorHeight?: number;
  width?: number;
  className?: string;
}

export const TickBar: React.FC<TickBarProps> = ({
  totalTicks = 25,
  activeTicks = 10,
  activeColor = '#E8FF1F',
  inactiveColor = 'rgba(255, 255, 255, 0.22)',
  majorStep = 5,
  height = 14,
  majorHeight = 22,
  className = '',
}) => {
  return (
    <div className={`flex items-end gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: totalTicks }).map((_, i) => {
        const isActive = i < activeTicks;
        const isMajor = (i + 1) % majorStep === 0 || i === 0;
        const barHeight = isMajor ? majorHeight : height;

        return (
          <div
            key={i}
            style={{
              height: `${barHeight}px`,
              backgroundColor: isActive ? activeColor : inactiveColor,
            }}
            className="w-[2px] rounded-full transition-all duration-300"
          />
        );
      })}
    </div>
  );
};
