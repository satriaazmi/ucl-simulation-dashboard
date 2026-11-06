import React, { useRef, useState, useEffect } from 'react';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

interface GlassSegmentedProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const GlassSegmented = <T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: GlassSegmentedProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState<React.CSSProperties>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const updateThumb = () => {
      if (!containerRef.current) return;
      const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
        `button[data-value="${value}"]`,
      );

      if (activeBtn) {
        setThumbStyle({
          width: `${activeBtn.offsetWidth}px`,
          transform: `translateX(${activeBtn.offsetLeft}px)`,
          height: `${activeBtn.offsetHeight}px`,
        });
        setIsReady(true);
      }
    };

    updateThumb();

    // Recalculate with ResizeObserver
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => updateThumb());
      ro.observe(containerRef.current);
    }

    // Recalculate after fonts are loaded
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(updateThumb).catch(() => {});
    }

    return () => {
      if (ro) ro.disconnect();
    };
  }, [value, options]);

  // Roving tabindex and arrow navigation: moves focus AND selects option
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = options.length - 1;
    }

    if (nextIndex !== index) {
      e.preventDefault();
      const nextOpt = options[nextIndex];
      onChange(nextOpt.value);

      // Move focus immediately to next button
      if (containerRef.current) {
        const nextBtn = containerRef.current.querySelector<HTMLButtonElement>(
          `button[data-value="${nextOpt.value}"]`,
        );
        nextBtn?.focus();
      }
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={`glass-segmented-root relative inline-flex items-center p-[3px] rounded-[14px] bg-white/[0.08] border border-white/[0.12] backdrop-blur-[20px] select-none ${className}`}
    >
      {/* Liquid Glass Sliding Thumb with spring overshoot & reduced-motion fallback */}
      <div
        className={`glass-segmented-thumb absolute top-[3px] left-0 rounded-[11px] pointer-events-none ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          ...thumbStyle,
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.10) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 6px 18px -6px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(8px) saturate(1.6)',
        }}
      />

      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            data-value={opt.value}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 flex items-center justify-center font-semibold tracking-[-0.01em] transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF1F] ${
              isSmall
                ? 'h-[24px] min-w-[36px] px-2.5 text-[11.5px] rounded-[9px]'
                : 'h-[28px] min-w-[44px] px-3 text-[12.5px] rounded-[11px]'
            } ${isSelected ? 'text-white font-bold' : 'text-white/60 hover:text-white/85'}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
