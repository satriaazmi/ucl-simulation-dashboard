import React from 'react';

interface MonogramProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  highlight?: boolean;
}

export const Monogram: React.FC<MonogramProps> = ({
  code,
  size = 'md',
  className = '',
  highlight = false,
}) => {
  const sizeClasses = {
    sm: 'w-[20px] h-[20px] text-[9.5px] rounded-[6px]',
    md: 'w-[26px] h-[26px] text-[11px] rounded-[8px]',
    lg: 'w-[36px] h-[36px] text-[13px] rounded-[10px]',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center font-bold tracking-tight select-none ${sizeClasses} ${
        highlight
          ? 'bg-[#E8FF1F] text-black shadow-[0_0_12px_rgba(232,255,31,0.4)]'
          : 'bg-white/10 text-white border border-white/10'
      } ${className}`}
    >
      {code.slice(0, 3).toUpperCase()}
    </div>
  );
};
