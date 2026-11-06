export interface SimulationMetadata {
  competition: string;
  season: string;
  simulation_date: string;
  model: string;
  total_training_matches: number;
  test_matches: number;
  n_simulations: number;
  test_deviance: {
    baseline_home: number;
    baseline_away: number;
    glm_home: number;
    glm_away: number;
  };
  tie_breaker_rules: string;
  knockout_format: string;
}

export interface MagicPoints {
  top8_median: number;
  top8_safe_95pct: number;
  playoff_median: number;
  playoff_safe_95pct: number;
  top8_cdf: number[];
  playoff_cdf: number[];
  top8_secure: Record<string, number>;
  playoff_secure: Record<string, number>;
}

export interface TeamMeta {
  code: string;
  country: string;
}

export interface EloInfo {
  elo: number;
  rank: number;
}

export interface CurrentTableEntry {
  P: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  GD: number;
  AwayGF: number;
  Wins: number;
  AwayWins: number;
  Coeff: number;
}

export interface ChampionOdd {
  Team: string;
  P_Champion_Pct: number;
  P_Final_Pct: number;
  P_SF_Pct: number;
  P_QF_Pct: number;
  P_R16_Pct: number;
}

export interface StandingProjection {
  Team: string;
  Current_Pts: number;
  Expected_Pts: number;
  SD_Pts: number;
  CI_95_Pts: string;
  P_Top8_Pct: number;
  P_Playoff_Pct: number;
  P_R16_Pct: number;
  P_QF_Pct: number;
  P_SF_Pct: number;
  P_Final_Pct: number;
  P_Champion_Pct: number;
  Rank: number;
}

export interface RemainingFixture {
  Matchday: number;
  HomeTeam: string;
  AwayTeam: string;
  lambda_home: number;
  mu_away: number;
  P_HomeWin: number;
  P_Draw: number;
  P_AwayWin: number;
}

export interface StageGivenRank {
  rank: number;
  n_samples: number;
  rates: [number, number, number, number, number]; // [R16, QF, SF, Final, Champion] in %
}

export interface UCLSimulationData {
  metadata: SimulationMetadata;
  magic_points: MagicPoints;
  team_meta: Record<string, TeamMeta>;
  elo: Record<string, EloInfo>;
  current_table: Record<string, CurrentTableEntry>;
  champion_odds: ChampionOdd[];
  standings_projection: StandingProjection[];
  rank_distribution: Record<string, number[]>;
  remaining_fixtures: RemainingFixture[];
  p_stage_given_rank: Record<string, StageGivenRank[]>;
}

export type StageKey = 'Champion' | 'Final' | 'SF' | 'QF' | 'R16';
export type ZoneKey = 'All' | 'Top8' | 'Bubble' | 'Elimination';
