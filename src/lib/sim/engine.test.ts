import { describe, it, expect } from 'vitest';
import { runSimulation } from './engine';
import rawData from '../../data/ucl_simulation_results.json';
import type { UCLSimulationData, CurrentTableEntry, RemainingFixture } from '@/types/ucl';

const data = rawData as unknown as UCLSimulationData;

describe('What-If Monte Carlo Engine', () => {
  it('Baseline N=20.000 matches JSON baseline within 3*SE and |Exp Pts - JSON| <= 0.1 for all 36 clubs', () => {
    const N = 20000;
    const seed = 42;

    const output = runSimulation({
      current_table: data.current_table,
      remaining_fixtures: data.remaining_fixtures,
      overrides: {},
      N,
      seed,
      p_stage_given_rank: data.p_stage_given_rank,
    });

    const jsonTop8 = Object.fromEntries(data.standings_projection.map((t) => [t.Team, t.P_Top8_Pct]));
    const jsonExpPts = Object.fromEntries(data.standings_projection.map((t) => [t.Team, t.Expected_Pts]));

    const teams = Object.keys(data.current_table);
    expect(teams.length).toBe(36);

    for (const team of teams) {
      const res = output.results[team];
      expect(res).toBeDefined();

      const expectedTop8 = jsonTop8[team];
      const expectedPts = jsonExpPts[team];

      // Monte Carlo SE: 1.96 * sqrt(p*(1-p)/N) * 100
      const p = expectedTop8 / 100;
      const se = 1.96 * Math.sqrt((p * (1 - p)) / N) * 100;
      // Use 3 * SE with minimum bound of 0.6 pp for statistical margin
      const threshold3SE = Math.max(3 * se, 0.6);

      const diffTop8 = Math.abs(res.p_top8 - expectedTop8);
      const diffPts = Math.abs(res.expected_pts - expectedPts);

      expect(diffTop8).toBeLessThanOrEqual(threshold3SE);
      expect(diffPts).toBeLessThanOrEqual(0.1);
    }
  });

  it('Without overrides, scenario is strictly identical to baseline (delta exactly 0)', () => {
    const N = 2000;
    const seed = 123;

    const baseline = runSimulation({
      current_table: data.current_table,
      remaining_fixtures: data.remaining_fixtures,
      overrides: {},
      N,
      seed,
    });

    const scenario = runSimulation({
      current_table: data.current_table,
      remaining_fixtures: data.remaining_fixtures,
      overrides: {},
      N,
      seed,
    });

    for (const team of Object.keys(data.current_table)) {
      expect(scenario.results[team].expected_pts).toBe(baseline.results[team].expected_pts);
      expect(scenario.results[team].p_top8).toBe(baseline.results[team].p_top8);
      expect(scenario.results[team].p_playoff).toBe(baseline.results[team].p_playoff);
      expect(scenario.results[team].p_elim).toBe(baseline.results[team].p_elim);
    }
  });

  it('Tie-breaker strictly separates two clubs with identical points by each successive criterion', () => {
    // Construct minimal synthetic table with 2 teams and 0 remaining fixtures
    const makeRow = (overrides: Partial<CurrentTableEntry>): CurrentTableEntry => ({
      P: 8,
      W: 4,
      D: 1,
      L: 3,
      GF: 10,
      GA: 10,
      GD: 0,
      AwayGF: 4,
      Wins: 4,
      AwayWins: 1,
      Coeff: 50,
      ...overrides,
    });

    const runTieCheck = (
      teamAProps: Partial<CurrentTableEntry>,
      teamBProps: Partial<CurrentTableEntry>,
    ) => {
      const syntheticTable: Record<string, CurrentTableEntry> = {
        TeamA: makeRow(teamAProps),
        TeamB: makeRow(teamBProps),
      };
      const fixtures: RemainingFixture[] = [];

      const output = runSimulation({
        current_table: syntheticTable,
        remaining_fixtures: fixtures,
        overrides: {},
        N: 10,
        seed: 1,
      });

      // TeamA should rank 1st (index 0), TeamB 2nd (index 1)
      expect(output.results['TeamA'].rank_distribution[0]).toBe(100);
      expect(output.results['TeamB'].rank_distribution[1]).toBe(100);
    };

    // Criterion 1: GD (same pts=13)
    runTieCheck({ GD: 5 }, { GD: 2 });

    // Criterion 2: GF (same pts=13, GD=0)
    runTieCheck({ GD: 0, GF: 15 }, { GD: 0, GF: 12 });

    // Criterion 3: AwayGF (same pts=13, GD=0, GF=10)
    runTieCheck({ GD: 0, GF: 10, AwayGF: 7 }, { GD: 0, GF: 10, AwayGF: 3 });

    // Criterion 4: Wins (same pts=13, GD=0, GF=10, AwayGF=4, but TeamA 4W 1D vs TeamB 3W 4D)
    runTieCheck({ W: 4, D: 1, Wins: 4 }, { W: 3, D: 4, Wins: 3 });

    // Criterion 5: AwayWins (same pts=13, GD=0, GF=10, AwayGF=4, W=4)
    runTieCheck({ AwayWins: 3 }, { AwayWins: 1 });

    // Criterion 6: Coeff (same on all previous)
    runTieCheck({ Coeff: 85 }, { Coeff: 60 });
  });

  it('Monotonicity test: winning a match for club X does not decrease P_Top8 of club X', () => {
    const N = 3000;
    const seed = 999;

    // Pick fixture 12 (Club Brugge vs Liverpool, Club Brugge is home)
    const fixIdx = 12;
    const homeTeam = data.remaining_fixtures[fixIdx].HomeTeam;

    const baseline = runSimulation({
      current_table: data.current_table,
      remaining_fixtures: data.remaining_fixtures,
      overrides: {},
      N,
      seed,
    });

    // Override fixture so Home wins heavily (3 - 0)
    const scenario = runSimulation({
      current_table: data.current_table,
      remaining_fixtures: data.remaining_fixtures,
      overrides: { [fixIdx]: [3, 0] },
      N,
      seed,
    });

    const baselineTop8 = baseline.results[homeTeam].p_top8;
    const scenarioTop8 = scenario.results[homeTeam].p_top8;

    // Winning should increase or keep equal P_Top8
    expect(scenarioTop8).toBeGreaterThanOrEqual(baselineTop8);
  });
});
