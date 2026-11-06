import React, { useEffect, useRef, useState } from 'react';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerIndex?: number;
  direction?: 'up' | 'left' | 'right' | 'scale';
  threshold?: number;
  as?: 'div' | 'section' | 'article';
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  staggerIndex,
  direction = 'up',
  threshold = 0.1,
  as: Tag = 'div',
}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
        !('IntersectionObserver' in window),
    );
  });

  useEffect(() => {
    if (revealed || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const node = elementRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
            break;
          }
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed, threshold]);

  const calculatedDelay = delay || (typeof staggerIndex === 'number' ? staggerIndex * 60 : 0);

  const style: React.CSSProperties = {
    transitionDelay: calculatedDelay ? `${calculatedDelay}ms` : undefined,
  };

  const directionClass = direction ? `slide-${direction}` : 'slide-up';

  return (
    <Tag
      ref={elementRef as unknown as React.Ref<HTMLDivElement>}
      className={`scroll-reveal ${directionClass} ${revealed ? 'is-revealed' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
};

export default ScrollReveal;
