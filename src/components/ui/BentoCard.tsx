import React from 'react';

export type BentoCardVariant = 'glass' | 'blue' | 'graph' | 'lime' | 'pink' | 'copper' | 'green';

interface BentoCardProps {
  variant?: BentoCardVariant;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  id?: string;
  onClick?: () => void;
}

const GRADIENT_STYLES: Record<string, { bg: string; core: string }> = {
  blue: {
    bg: 'linear-gradient(180deg, #b9a6ff 0%, #2e43ff 36%, #2e43ff 74%, #6d7dff 100%)',
    core: '#05082a',
  },
  graph: {
    bg: 'linear-gradient(180deg, #9a9aa8 0%, #3a3a44 36%, #3a3a44 74%, #55555f 100%)',
    core: '#060608',
  },
  lime: {
    bg: 'linear-gradient(180deg, #f4ffb8 0%, #a3c400 36%, #a3c400 74%, #c9e03a 100%)',
    core: '#121700',
  },
  pink: {
    bg: 'linear-gradient(180deg, #ffb3d6 0%, #ff2a85 36%, #ff2a85 74%, #ff6aa8 100%)',
    core: '#3a031c',
  },
  copper: {
    bg: 'linear-gradient(180deg, #f6bf96 0%, #c2683a 36%, #c2683a 74%, #dc8a5c 100%)',
    core: '#1d0b05',
  },
  green: {
    bg: 'linear-gradient(180deg, #a6e8c8 0%, #36956f 36%, #36956f 74%, #58b58c 100%)',
    core: '#061d15',
  },
};

export const BentoCard: React.FC<BentoCardProps> = ({
  variant = 'glass',
  className = '',
  style = {},
  children,
  id,
  onClick,
}) => {
  const isGlass = variant === 'glass';
  const grad = GRADIENT_STYLES[variant];

  return (
    <section
      id={id}
      onClick={onClick}
      style={style}
      className={`bento-card ${
        isGlass
          ? 'glass-card'
          : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Background Gradient & Core Elips */}
      {!isGlass && grad && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: grad.bg }}
          />
          <div
            className="card-core pointer-events-none"
            style={{ background: grad.core }}
          />
        </>
      )}

      {/* Card Rim Shadow (for non-glass) */}
      {!isGlass && <div className="card-rim" />}

      {/* Content Layer */}
      <div className="relative z-20 h-full p-[20px_22px] sm:p-[22px_24px] flex flex-col justify-between">
        {children}
      </div>
    </section>
  );
};
