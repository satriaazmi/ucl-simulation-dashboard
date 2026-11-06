import { mulberry32, samplePoisson } from './prng';
import type { CurrentTableEntry, RemainingFixture, StageGivenRank } from '@/types/ucl';

export interface SimulationInput {
  current_table: Record<string, CurrentTableEntry>;
  remaining_fixtures: RemainingFixture[];
  overrides?: Record<number, [number, number]>;
  N: number;
  seed: number;
  p_stage_given_rank?: Record<string, StageGivenRank[]>;
}

export interface ClubSimulationResult {
  team: string;
  expected_pts: number;
  sd_pts: number;
  rank_distribution: number[]; // 36 entries, percentage (0 - 100)
  p_top8: number;
  p_playoff: number;
  p_elim: number;
  p_r16: number;
  p_qf: number;
  p_sf: number;
  p_final: number;
  p_champion: number;
  se_top8: number; // Monte Carlo error in percentage points (1.96 * sqrt(p*(1-p)/N))
  se_playoff: number;
  se_elim: number;
  has_sparse_knockout_data: boolean;
}

export interface SimulationOutput {
  results: Record<string, ClubSimulationResult>;
  elapsed_ms: number;
  N: number;
  seed: number;
}

interface KnockoutRatesResult {
  rates: [number, number, number, number, number];
  sparse: boolean;
}

function resolveKnockoutRates(
  table: StageGivenRank[] | undefined,
  rank1Indexed: number,
): KnockoutRatesResult | null {
  if (!table || table.length === 0) return null;

  const exact = table.find((item) => item.rank === rank1Indexed);
  if (exact && exact.n_samples >= 30) {
    return { rates: exact.rates, sparse: false };
  }

  // Look for neighbors within +/- 2 ranks of the same club
  const neighbors = table.filter(
    (item) => Math.abs(item.rank - rank1Indexed) <= 2 && item.n_samples > 0,
  );
  const totalWeight = neighbors.reduce((acc, item) => acc + item.n_samples, 0);

  if (totalWeight > 0) {
    const smoothedRates: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (const nb of neighbors) {
      for (let s = 0; s < 5; s++) {
        smoothedRates[s] += (nb.rates[s] * nb.n_samples) / totalWeight;
      }
    }
    return { rates: smoothedRates, sparse: true };
  }

  return null;
}

export function runSimulation(input: SimulationInput): SimulationOutput {
  const startTime = performance.now();
  const { current_table, remaining_fixtures, overrides = {}, N, seed, p_stage_given_rank } = input;

  const teamNames = Object.keys(current_table);
  const nTeams = teamNames.length;
  const teamIndexMap = new Map<string, number>();
  for (let i = 0; i < nTeams; i++) {
    teamIndexMap.set(teamNames[i], i);
  }

  // Initial table data
  const initPts = new Float64Array(nTeams);
  const initGD = new Float64Array(nTeams);
  const initGF = new Float64Array(nTeams);
  const initAwayGF = new Float64Array(nTeams);
  const initW = new Float64Array(nTeams);
  const initAW = new Float64Array(nTeams);
  const coeff = new Float64Array(nTeams);

  for (let i = 0; i < nTeams; i++) {
    const row = current_table[teamNames[i]];
    initPts[i] = row.W * 3 + row.D;
    initGD[i] = row.GD;
    initGF[i] = row.GF;
    initAwayGF[i] = row.AwayGF;
    initW[i] = row.W;
    initAW[i] = row.AwayWins;
    coeff[i] = row.Coeff;
  }

  const nFixtures = remaining_fixtures.length;
  const fixtureList = new Array<{ h: number; a: number; l: number; m: number }>(nFixtures);
  for (let m = 0; m < nFixtures; m++) {
    const fix = remaining_fixtures[m];
    const hIdx = teamIndexMap.get(fix.HomeTeam);
    const aIdx = teamIndexMap.get(fix.AwayTeam);
    fixtureList[m] = {
      h: hIdx !== undefined ? hIdx : 0,
      a: aIdx !== undefined ? aIdx : 1,
      l: fix.lambda_home,
      m: fix.mu_away,
    };
  }

  // Common random numbers: each match gets its own stream (seed * 1000 + m)
  const matchRngs = new Array<() => number>(nFixtures);
  for (let m = 0; m < nFixtures; m++) {
    matchRngs[m] = mulberry32((seed * 1000 + m) | 0);
  }

  // Simulation buffers
  const pts = new Float64Array(nTeams);
  const gd = new Float64Array(nTeams);
  const gf = new Float64Array(nTeams);
  const awayGF = new Float64Array(nTeams);
  const w = new Float64Array(nTeams);
  const aw = new Float64Array(nTeams);
  const compositeKeys = new Float64Array(nTeams);
  const order = new Int32Array(nTeams);

  // Result accumulators
  const totalPts = new Float64Array(nTeams);
  const totalPtsSq = new Float64Array(nTeams);
  const rankCounts = new Int32Array(nTeams * 36);
  const top8Counts = new Int32Array(nTeams);
  const playoffCounts = new Int32Array(nTeams);
  const elimCounts = new Int32Array(nTeams);

  for (let iter = 0; iter < N; iter++) {
    pts.set(initPts);
    gd.set(initGD);
    gf.set(initGF);
    awayGF.set(initAwayGF);
    w.set(initW);
    aw.set(initAW);

    for (let m = 0; m < nFixtures; m++) {
      const fix = fixtureList[m];
      const h = fix.h;
      const a = fix.a;

      let gh: number;
      let ga: number;

      if (overrides[m] !== undefined) {
        gh = overrides[m][0];
        ga = overrides[m][1];
      } else {
        const rng = matchRngs[m];
        gh = samplePoisson(rng, fix.l);
        ga = samplePoisson(rng, fix.m);
      }

      gf[h] += gh;
      gf[a] += ga;
      gd[h] += gh - ga;
      gd[a] += ga - gh;
      awayGF[a] += ga;

      if (gh > ga) {
        pts[h] += 3;
        w[h] += 1;
      } else if (gh === ga) {
        pts[h] += 1;
        pts[a] += 1;
      } else {
        pts[a] += 3;
        w[a] += 1;
        aw[a] += 1;
      }
    }

    // Compute composite keys per UEFA 6 criteria:
    // pts*1e10 + (GD+100)*1e7 + GF*1e5 + AwayGF*1e3 + W*1e2 + AW*10 + Coeff/1000
    for (let i = 0; i < nTeams; i++) {
      order[i] = i;
      compositeKeys[i] =
        pts[i] * 1e10 +
        (gd[i] + 100) * 1e7 +
        gf[i] * 1e5 +
        awayGF[i] * 1e3 +
        w[i] * 1e2 +
        aw[i] * 10 +
        coeff[i] / 1000;

      totalPts[i] += pts[i];
      totalPtsSq[i] += pts[i] * pts[i];
    }

    order.sort((aIdx, bIdx) => compositeKeys[bIdx] - compositeKeys[aIdx]);

    for (let rank = 0; rank < nTeams; rank++) {
      const t = order[rank];
      rankCounts[t * 36 + rank]++;
      if (rank < 8) {
        top8Counts[t]++;
      } else if (rank < 24) {
        playoffCounts[t]++;
      } else {
        elimCounts[t]++;
      }
    }
  }

  // Post-process metrics per club
  const results: Record<string, ClubSimulationResult> = {};

  for (let i = 0; i < nTeams; i++) {
    const team = teamNames[i];
    const meanPts = totalPts[i] / N;
    const variancePts = Math.max(0, totalPtsSq[i] / N - meanPts * meanPts);
    const sdPts = Math.sqrt(variancePts);

    const rankDist = new Array<number>(36);
    for (let r = 0; r < 36; r++) {
      rankDist[r] = (rankCounts[i * 36 + r] / N) * 100;
    }

    const pTop8 = (top8Counts[i] / N) * 100;
    const pPlayoff = (playoffCounts[i] / N) * 100;
    const pElim = (elimCounts[i] / N) * 100;

    // Monte Carlo error: 1.96 * sqrt(p * (1 - p) / N) in percentage points
    const calcSE = (pPct: number): number => {
      const p = Math.max(0, Math.min(1, pPct / 100));
      return 1.96 * Math.sqrt((p * (1 - p)) / N) * 100;
    };

    const seTop8 = calcSE(pTop8);
    const sePlayoff = calcSE(pPlayoff);
    const seElim = calcSE(pElim);

    // Compute knockout stage rates
    let pR16 = 0;
    let pQF = 0;
    let pSF = 0;
    let pFinal = 0;
    let pChampion = 0;
    let sparseKnockout = false;

    const teamKnockoutTable = p_stage_given_rank ? p_stage_given_rank[team] : undefined;

    for (let r = 0; r < 36; r++) {
      const pRankFraction = rankCounts[i * 36 + r] / N;
      if (pRankFraction <= 0) continue;

      const rateInfo = resolveKnockoutRates(teamKnockoutTable, r + 1);
      if (rateInfo) {
        if (rateInfo.sparse) sparseKnockout = true;
        pR16 += pRankFraction * rateInfo.rates[0];
        pQF += pRankFraction * rateInfo.rates[1];
        pSF += pRankFraction * rateInfo.rates[2];
        pFinal += pRankFraction * rateInfo.rates[3];
        pChampion += pRankFraction * rateInfo.rates[4];
      } else {
        sparseKnockout = true;
      }
    }

    results[team] = {
      team,
      expected_pts: meanPts,
      sd_pts: sdPts,
      rank_distribution: rankDist,
      p_top8: pTop8,
      p_playoff: pPlayoff,
      p_elim: pElim,
      p_r16: pR16,
      p_qf: pQF,
      p_sf: pSF,
      p_final: pFinal,
      p_champion: pChampion,
      se_top8: seTop8,
      se_playoff: sePlayoff,
      se_elim: seElim,
      has_sparse_knockout_data: sparseKnockout,
    };
  }

  const elapsed = performance.now() - startTime;

  return {
    results,
    elapsed_ms: elapsed,
    N,
    seed,
  };
}
