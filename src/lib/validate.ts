import type { UCLSimulationData } from '@/types/ucl';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSimulationData(data: UCLSimulationData): ValidationResult {
  const errors: string[] = [];

  if (!data) {
    return { valid: false, errors: ['Data simulasi kosong atau tidak terdefinisi.'] };
  }

  // 1. Validasi 36 klub di current_table
  const teams = Object.keys(data.current_table || {});
  if (teams.length !== 36) {
    errors.push(`Jumlah klub di current_table adalah ${teams.length}, diharapkan 36.`);
  }

  // 2. Validasi 72 laga sisa
  const fixtures = data.remaining_fixtures || [];
  if (fixtures.length !== 72) {
    errors.push(`Jumlah laga tersisa adalah ${fixtures.length}, diharapkan 72.`);
  }

  // 3. Validasi tiap klub punya tepat 4 laga sisa
  const matchCounts: Record<string, number> = {};
  for (const f of fixtures) {
    matchCounts[f.HomeTeam] = (matchCounts[f.HomeTeam] || 0) + 1;
    matchCounts[f.AwayTeam] = (matchCounts[f.AwayTeam] || 0) + 1;
  }
  for (const team of teams) {
    const count = matchCounts[team] || 0;
    if (count !== 4) {
      errors.push(`Klub ${team} memiliki ${count} laga sisa, diharapkan 4 laga.`);
    }
  }

  // 4. Validasi keberadaan tiap klub di field utama
  for (const team of teams) {
    if (!data.elo || !data.elo[team]) {
      errors.push(`Field elo hilang untuk klub: ${team}`);
    }
    if (!data.team_meta || !data.team_meta[team]) {
      errors.push(`Field team_meta hilang untuk klub: ${team}`);
    }
    if (!data.rank_distribution || !data.rank_distribution[team]) {
      errors.push(`Field rank_distribution hilang untuk klub: ${team}`);
    } else {
      // 5. Validasi penjumlahan rank_distribution mendekati 100%
      const sumDist = data.rank_distribution[team].reduce((a, b) => a + b, 0);
      if (Math.abs(sumDist - 100) > 1.5) {
        errors.push(
          `Distribusi peringkat untuk ${team} berjumlah ${sumDist.toFixed(1)}%, diharapkan ≈100%.`,
        );
      }
    }
    if (!data.p_stage_given_rank || !data.p_stage_given_rank[team]) {
      errors.push(`Field p_stage_given_rank hilang untuk klub: ${team}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
