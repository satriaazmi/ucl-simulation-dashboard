export const TOP8_ZONE = {
  startRank: 1,
  endRank: 8,
  count: 8,
  label: 'Top 8 Langsung Lolos 16 Besar',
  shortLabel: 'Top 8',
} as const;

export const PLAYOFF_ZONE = {
  startRank: 9,
  endRank: 24,
  count: 16,
  label: 'Jalur Playoff Knockout Phase',
  shortLabel: 'Playoff (9–24)',
} as const;

export const ELIMINATION_ZONE = {
  startRank: 25,
  endRank: 36,
  count: 12,
  label: 'Tersingkir dari Kompetisi Eropa',
  shortLabel: 'Eliminasi (25–36)',
} as const;

export const ZONE_COUNTS_LABEL = `${TOP8_ZONE.count} / ${PLAYOFF_ZONE.count} / ${ELIMINATION_ZONE.count} Klub`;

export type ZoneType = 'Top8' | 'Playoff' | 'Elimination';

export function getRankZone(rank: number): ZoneType {
  if (rank <= 8) return 'Top8';
  if (rank <= 24) return 'Playoff';
  return 'Elimination';
}

export function getZoneArrow(rank: number): '↑' | '→' | '↓' {
  if (rank <= 8) return '↑';
  if (rank <= 24) return '→';
  return '↓';
}
