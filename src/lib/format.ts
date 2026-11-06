export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) {
    console.warn('fmtInt: missing or invalid number', n);
    return '—';
  }
  return Math.round(n).toLocaleString('id-ID');
}

export function fmtNum(n: number | null | undefined, dec = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) {
    console.warn('fmtNum: missing or invalid number', n);
    return '—';
  }
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export function fmtPct(n: number | null | undefined, dec = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) {
    console.warn('fmtPct: missing or invalid percentage', n);
    return '—';
  }
  return `${fmtNum(n, dec)}%`;
}

export interface NormalizedOdds {
  homePct: number;
  drawPct: number;
  awayPct: number;
  homeWidth: number;
  drawWidth: number;
  awayWidth: number;
  homeLabel: string;
  drawLabel: string;
  awayLabel: string;
}

export function normalizeMatchOdds(
  pHome: number | null | undefined,
  pDraw: number | null | undefined,
  pAway: number | null | undefined,
): NormalizedOdds {
  const h = typeof pHome === 'number' && !Number.isNaN(pHome) ? pHome : 0;
  const d = typeof pDraw === 'number' && !Number.isNaN(pDraw) ? pDraw : 0;
  const a = typeof pAway === 'number' && !Number.isNaN(pAway) ? pAway : 0;

  const total = h + d + a;
  if (total <= 0) {
    console.warn('normalizeMatchOdds: sum of match probabilities <= 0');
    return {
      homePct: 33,
      drawPct: 34,
      awayPct: 33,
      homeWidth: 33.33,
      drawWidth: 33.34,
      awayWidth: 33.33,
      homeLabel: '—',
      drawLabel: '—',
      awayLabel: '—',
    };
  }

  const normH = (h / total) * 100;
  const normD = (d / total) * 100;
  const normA = (a / total) * 100;

  const roundH = Math.round(normH);
  const roundD = Math.round(normD);
  const roundA = 100 - roundH - roundD;

  return {
    homePct: roundH,
    drawPct: roundD,
    awayPct: roundA,
    homeWidth: normH,
    drawWidth: normD,
    awayWidth: normA,
    homeLabel: `${roundH}%`,
    drawLabel: `${roundD}% seri`,
    awayLabel: `${roundA}%`,
  };
}
