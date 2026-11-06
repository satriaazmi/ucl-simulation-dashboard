import React, { useState } from 'react';
import { Play, RotateCcw, Trophy, Check } from 'lucide-react';
import { Monogram } from './Monogram';
import type { UCLSimulationData } from '@/types/ucl';
import { fmtPct } from '../../lib/format';

interface BracketViewProps {
  data: UCLSimulationData;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  className?: string;
}

interface MatchTieResult {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: string;
}

interface TournamentSimResult {
  simId: number;
  playoffSilver: MatchTieResult[];
  playoffBlue: MatchTieResult[];
  r16Silver: MatchTieResult[];
  r16Blue: MatchTieResult[];
  qfSilver: MatchTieResult[];
  qfBlue: MatchTieResult[];
  sfSilver: MatchTieResult;
  sfBlue: MatchTieResult;
  finalistSilver: string;
  finalistBlue: string;
  finalScore: [number, number];
  champion: string;
}

// Simple Poisson generator for bracket matches
function samplePoisson(lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > limit);
  return k - 1;
}

interface MatchBoxProps {
  teamA: string;
  teamB: string;
  badgeA?: string;
  badgeB?: string;
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  isSimulated?: boolean;
  note?: string;
  selectedTeam: string;
  teamMeta: Record<string, { code: string; country: string }>;
  onSelectTeam: (team: string) => void;
}

// Reusable Match Box Card (Declared outside render per Phase 5 & oxlint rules)
const MatchBox: React.FC<MatchBoxProps> = ({
  teamA,
  teamB,
  badgeA,
  badgeB,
  scoreA,
  scoreB,
  winner,
  isSimulated,
  note,
  selectedTeam,
  teamMeta,
  onSelectTeam,
}) => {
  const isWinnerA = isSimulated && winner === teamA;
  const isWinnerB = isSimulated && winner === teamB;
  const isSelectedA = teamA === selectedTeam;
  const isSelectedB = teamB === selectedTeam;

  const metaA = teamMeta[teamA] || { code: teamA.slice(0, 3).toUpperCase(), country: '' };
  const metaB = teamMeta[teamB] || { code: teamB.slice(0, 3).toUpperCase(), country: '' };

  return (
    <div
      className={`p-2 rounded-xl bg-white/[0.03] border transition-all ${
        isSimulated ? 'border-white/20 bg-white/[0.05]' : 'border-white/10'
      } flex flex-col gap-1 w-full shadow-md`}
    >
      {/* Team A */}
      <div
        onClick={() => teamA && onSelectTeam(teamA)}
        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
          isSelectedA
            ? 'bg-[#E8FF1F]/20 text-[#E8FF1F] font-bold border border-[#E8FF1F]/40'
            : isWinnerA
              ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
              : 'hover:bg-white/5 text-white/85'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {teamA ? (
            <Monogram code={metaA.code} size="sm" highlight={isSelectedA} />
          ) : (
            <span className="w-5 h-5 rounded bg-white/10 inline-block" />
          )}
          <span className="truncate text-xs">{teamA || 'Menunggu'}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 font-mono-num text-[11px]">
          {isWinnerA && <Check size={12} className="text-[#10B981]" />}
          {scoreA !== undefined && <span className="font-bold">{scoreA}</span>}
          {badgeA && <span className="text-[9.5px] text-white/40">{badgeA}</span>}
        </div>
      </div>

      {/* Team B */}
      <div
        onClick={() => teamB && onSelectTeam(teamB)}
        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
          isSelectedB
            ? 'bg-[#E8FF1F]/20 text-[#E8FF1F] font-bold border border-[#E8FF1F]/40'
            : isWinnerB
              ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
              : 'hover:bg-white/5 text-white/85'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {teamB ? (
            <Monogram code={metaB.code} size="sm" highlight={isSelectedB} />
          ) : (
            <span className="w-5 h-5 rounded bg-white/10 inline-block" />
          )}
          <span className="truncate text-xs">{teamB || 'Menunggu'}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 font-mono-num text-[11px]">
          {isWinnerB && <Check size={12} className="text-[#10B981]" />}
          {scoreB !== undefined && <span className="font-bold">{scoreB}</span>}
          {badgeB && <span className="text-[9.5px] text-white/40">{badgeB}</span>}
        </div>
      </div>

      {note && (
        <div className="text-[9.5px] text-right font-mono-num text-white/40 pt-0.5 border-t border-white/5 truncate">
          {note}
        </div>
      )}
    </div>
  );
};

export const BracketView: React.FC<BracketViewProps> = ({
  data,
  selectedTeam,
  onSelectTeam,
  className = '',
}) => {
  const [simResult, setSimResult] = useState<TournamentSimResult | null>(null);

  const teamRow = data.standings_projection.find((t) => t.Team === selectedTeam);
  const teamOdds = data.champion_odds.find((t) => t.Team === selectedTeam);

  const projectedRanks = data.standings_projection;
  const getTeamAtRank = (r: number) => projectedRanks[r - 1]?.Team || `Rank ${r}`;
  const getMeta = (team: string) =>
    data.team_meta[team] || { code: team.slice(0, 3).toUpperCase(), country: '' };

  const getElo = (team: string): number => {
    const eloObj = data.elo[team];
    if (!eloObj) {
      console.warn(`Data Elo tidak ditemukan untuk klub: ${team}`);
      return 1500;
    }
    return eloObj.elo;
  };

  // Verifikasi terhadap regulasi resmi UEFA (Pasal 19) sebelum rilis.
  const silverR16Seeds = [1, 7, 3, 5];
  const blueR16Seeds = [2, 8, 4, 6];

  const silverPlayoffs = [
    { seedRank: '15/16', seedTeam: getTeamAtRank(15), unseedRank: '17/18', unseedTeam: getTeamAtRank(17), meets: 1 },
    { seedRank: '9/10', seedTeam: getTeamAtRank(9), unseedRank: '23/24', unseedTeam: getTeamAtRank(23), meets: 7 },
    { seedRank: '13/14', seedTeam: getTeamAtRank(13), unseedRank: '19/20', unseedTeam: getTeamAtRank(19), meets: 3 },
    { seedRank: '11/12', seedTeam: getTeamAtRank(11), unseedRank: '21/22', unseedTeam: getTeamAtRank(21), meets: 5 },
  ];

  const bluePlayoffs = [
    { seedRank: '15/16', seedTeam: getTeamAtRank(16), unseedRank: '17/18', unseedTeam: getTeamAtRank(18), meets: 2 },
    { seedRank: '9/10', seedTeam: getTeamAtRank(10), unseedRank: '23/24', unseedTeam: getTeamAtRank(24), meets: 8 },
    { seedRank: '13/14', seedTeam: getTeamAtRank(14), unseedRank: '19/20', unseedTeam: getTeamAtRank(20), meets: 4 },
    { seedRank: '11/12', seedTeam: getTeamAtRank(12), unseedRank: '21/22', unseedTeam: getTeamAtRank(22), meets: 6 },
  ];

  // Two-leg simulation helper based on Elo formula: 1 / (1 + 10^(-(eloA - eloB)/400))
  const simulateTie = (teamA: string, teamB: string, aIsHomeLeg2 = true): MatchTieResult => {
    const eloA = getElo(teamA);
    const eloB = getElo(teamB);

    // Dynamic Elo expectation
    const expWinA = 1 / (1 + 10 ** (-(eloA - eloB) / 400));

    // Leg 1: Team B home (if aIsHomeLeg2)
    const expB_L1 = 1 / (1 + 10 ** (-(eloB + (aIsHomeLeg2 ? 50 : -50) - eloA) / 400));
    const lamB1 = Math.max(0.4, 1.35 * (1 + (expB_L1 - 0.5) * 1.1));
    const lamA1 = Math.max(0.4, 1.25 * (1 - (expB_L1 - 0.5) * 1.1));
    const gB1 = samplePoisson(lamB1);
    const gA1 = samplePoisson(lamA1);

    // Leg 2: Team A home (if aIsHomeLeg2)
    const expA_L2 = 1 / (1 + 10 ** (-(eloA + (aIsHomeLeg2 ? 50 : -50) - eloB) / 400));
    const lamA2 = Math.max(0.4, 1.35 * (1 + (expA_L2 - 0.5) * 1.1));
    const lamB2 = Math.max(0.4, 1.25 * (1 - (expA_L2 - 0.5) * 1.1));
    const gA2 = samplePoisson(lamA2);
    const gB2 = samplePoisson(lamB2);

    let totA = gA1 + gA2;
    let totB = gB1 + gB2;

    if (totA === totB) {
      // Extra time / penalties probabilistically broken by overall Elo expectation
      if (Math.random() < expWinA) {
        totA += 1;
      } else {
        totB += 1;
      }
    }

    return {
      teamA,
      teamB,
      scoreA: totA,
      scoreB: totB,
      winner: totA > totB ? teamA : teamB,
    };
  };

  const handleSimulateTournament = () => {
    // 1. Playoff Silver
    const poSilverResults: MatchTieResult[] = silverPlayoffs.map((po) =>
      simulateTie(po.seedTeam, po.unseedTeam, true),
    );

    // 2. Playoff Blue
    const poBlueResults: MatchTieResult[] = bluePlayoffs.map((po) =>
      simulateTie(po.seedTeam, po.unseedTeam, true),
    );

    // 3. R16 Silver
    const r16SilverTies: [string, string][] = [
      [getTeamAtRank(silverR16Seeds[0]), poSilverResults[0].winner],
      [getTeamAtRank(silverR16Seeds[1]), poSilverResults[1].winner],
      [getTeamAtRank(silverR16Seeds[2]), poSilverResults[2].winner],
      [getTeamAtRank(silverR16Seeds[3]), poSilverResults[3].winner],
    ];
    const r16SilverResults = r16SilverTies.map(([seed, unseed]) => simulateTie(seed, unseed, true));

    // 4. R16 Blue
    const r16BlueTies: [string, string][] = [
      [getTeamAtRank(blueR16Seeds[0]), poBlueResults[0].winner],
      [getTeamAtRank(blueR16Seeds[1]), poBlueResults[1].winner],
      [getTeamAtRank(blueR16Seeds[2]), poBlueResults[2].winner],
      [getTeamAtRank(blueR16Seeds[3]), poBlueResults[3].winner],
    ];
    const r16BlueResults = r16BlueTies.map(([seed, unseed]) => simulateTie(seed, unseed, true));

    // 5. QF Silver
    const qfSilverTies: [string, string][] = [
      [r16SilverResults[0].winner, r16SilverResults[1].winner],
      [r16SilverResults[2].winner, r16SilverResults[3].winner],
    ];
    const qfSilverResults = qfSilverTies.map(([a, b]) => simulateTie(a, b, Math.random() > 0.5));

    // 6. QF Blue
    const qfBlueTies: [string, string][] = [
      [r16BlueResults[0].winner, r16BlueResults[1].winner],
      [r16BlueResults[2].winner, r16BlueResults[3].winner],
    ];
    const qfBlueResults = qfBlueTies.map(([a, b]) => simulateTie(a, b, Math.random() > 0.5));

    // 7. Semifinal Silver & Blue
    const sfSilverRes = simulateTie(
      qfSilverResults[0].winner,
      qfSilverResults[1].winner,
      Math.random() > 0.5,
    );
    const sfBlueRes = simulateTie(
      qfBlueResults[0].winner,
      qfBlueResults[1].winner,
      Math.random() > 0.5,
    );

    // 8. Final (Single neutral leg)
    const finSil = sfSilverRes.winner;
    const finBlu = sfBlueRes.winner;
    const eloSil = getElo(finSil);
    const eloBlu = getElo(finBlu);
    const expSil = 1 / (1 + 10 ** (-(eloSil - eloBlu) / 400));

    const lamSil = Math.max(0.4, 1.35 * (1 + (expSil - 0.5) * 1.2));
    const lamBlu = Math.max(0.4, 1.35 * (1 - (expSil - 0.5) * 1.2));
    let gSil = samplePoisson(lamSil);
    let gBlu = samplePoisson(lamBlu);

    if (gSil === gBlu) {
      if (Math.random() < expSil) gSil += 1;
      else gBlu += 1;
    }

    const champ = gSil > gBlu ? finSil : finBlu;

    setSimResult({
      simId: Math.floor(Math.random() * 9000) + 1000,
      playoffSilver: poSilverResults,
      playoffBlue: poBlueResults,
      r16Silver: r16SilverResults,
      r16Blue: r16BlueResults,
      qfSilver: qfSilverResults,
      qfBlue: qfBlueResults,
      sfSilver: sfSilverRes,
      sfBlue: sfBlueRes,
      finalistSilver: finSil,
      finalistBlue: finBlu,
      finalScore: [gSil, gBlu],
      champion: champ,
    });
  };

  const handleResetTournament = () => {
    setSimResult(null);
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulateTournament}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8FF1F] hover:bg-[#d6ec18] text-black text-xs font-bold transition-all shadow-[0_0_16px_rgba(232,255,31,0.35)] cursor-pointer"
          >
            <Play size={14} fill="currentColor" />
            <span>{simResult ? 'Simulasikan Ulang Turnamen' : 'Simulasikan Turnamen'}</span>
          </button>

          {simResult && (
            <button
              type="button"
              onClick={handleResetTournament}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Bagan</span>
            </button>
          )}
        </div>

        <span className="text-xs font-mono-num text-white/50">
          satu contoh jalur acak berdasarkan Elo, bukan prediksi
          {simResult && ` (Simulasi #${simResult.simId.toString().slice(-4)})`}
        </span>
      </div>

      {/* Champion Celebration Banner (When simulated) */}
      {simResult && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E8FF1F]/15 via-[#E8FF1F]/25 to-[#E8FF1F]/15 border-2 border-[#E8FF1F] text-center shadow-[0_0_30px_rgba(232,255,31,0.3)] animate-modal-pop">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#E8FF1F] mb-1">
            <Trophy size={14} />
            <span>Hasil Simulasi Juara UEFA Champions League 2026/2027</span>
          </div>
          <div className="flex items-center justify-center gap-3 my-1">
            <Monogram code={getMeta(simResult.champion).code} size="lg" highlight />
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {simResult.champion}
            </span>
          </div>
          <p className="text-xs text-white/80 font-mono-num mt-1">
            Final: {simResult.finalistSilver} ({simResult.finalScore[0]}) vs{' '}
            {simResult.finalistBlue} ({simResult.finalScore[1]})
          </p>
        </div>
      )}

      {/* Selected Team Path Summary Banner */}
      {teamRow && (
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Monogram code={getMeta(selectedTeam).code} size="lg" highlight />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">{selectedTeam}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono-num">
                  Proyeksi #{teamRow.Rank}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Jalur bagan turnamen resmi UEFA Pasal 19 berdasarkan hasil proyeksi klasemen fase liga.
              </p>
            </div>
          </div>

          {/* Strip statistik ber-flex-wrap agar tidak overflow di mobile */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono-num max-w-full">
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="block text-white/40 text-[10px]">16 Besar</span>
              <span className="font-bold text-white">{fmtPct(teamRow.P_R16_Pct, 1)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="block text-white/40 text-[10px]">Perempat Final</span>
              <span className="font-bold text-white">{fmtPct(teamRow.P_QF_Pct, 1)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="block text-white/40 text-[10px]">Semifinal</span>
              <span className="font-bold text-white">{fmtPct(teamRow.P_SF_Pct, 1)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="block text-white/40 text-[10px]">Final</span>
              <span className="font-bold text-white">{fmtPct(teamRow.P_Final_Pct, 1)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#E8FF1F]/15 border border-[#E8FF1F]/30 text-center">
              <span className="block text-[#E8FF1F]/70 text-[10px]">Juara</span>
              <span className="font-bold text-[#E8FF1F]">
                {teamOdds ? fmtPct(teamOdds.P_Champion_Pct, 1) : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE 9-COLUMN TOURNAMENT BRACKET TREE */}
      <div className="w-full max-w-full overflow-x-auto pb-4 min-w-0">
        <div className="min-w-[1780px] grid grid-cols-9 gap-3 text-xs items-stretch">
          {/* ================================================================ */}
          {/* COL 1: PLAYOFF SILVER (4 TIES)                                   */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Playoff (Silver)</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-4 py-2">
              {silverPlayoffs.map((po, idx) => {
                const res = simResult?.playoffSilver[idx];
                return (
                  <MatchBox
                    key={`po-sil-${idx}`}
                    teamA={po.seedTeam}
                    teamB={po.unseedTeam}
                    badgeA={`#${po.seedRank}`}
                    badgeB={`#${po.unseedRank}`}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} · Lolos` : `Lolos ke R16 #${po.meets}`}
                  />
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 2: 16 BESAR SILVER (4 TIES)                                  */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>16 Besar (Silver)</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-4 py-2">
              {silverR16Seeds.map((seedRank, idx) => {
                const res = simResult?.r16Silver[idx];
                const poWinner = simResult ? simResult.playoffSilver[idx].winner : '';
                return (
                  <MatchBox
                    key={`r16-sil-${idx}`}
                    teamA={getTeamAtRank(seedRank)}
                    teamB={poWinner || `Pemenang PO #${seedRank}`}
                    badgeA={`#${seedRank}`}
                    badgeB={poWinner ? undefined : 'PO'}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} ke QF` : 'Lolos ke Perempat Final'}
                  />
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 3: PEREMPAT FINAL SILVER (2 TIES)                            */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Perempat Final</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-12 py-6">
              {[0, 1].map((idx) => {
                const res = simResult?.qfSilver[idx];
                const teamA = simResult ? simResult.r16Silver[idx * 2].winner : '';
                const teamB = simResult ? simResult.r16Silver[idx * 2 + 1].winner : '';
                return (
                  <MatchBox
                    key={`qf-sil-${idx}`}
                    teamA={teamA || `Pemenang R16 ${idx * 2 + 1}`}
                    teamB={teamB || `Pemenang R16 ${idx * 2 + 2}`}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} ke SF` : 'Lolos ke Semifinal'}
                  />
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 4: SEMIFINAL SILVER (1 TIE)                                  */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Semifinal</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-center flex-1 py-8">
              {(() => {
                const res = simResult?.sfSilver;
                const teamA = simResult ? simResult.qfSilver[0].winner : '';
                const teamB = simResult ? simResult.qfSilver[1].winner : '';

                return (
                  <MatchBox
                    teamA={teamA || 'Pemenang QF 1'}
                    teamB={teamB || 'Pemenang QF 2'}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} ke Final` : 'Lolos ke Partai Puncak'}
                  />
                );
              })()}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 5: PARTAI PUNCAK FINAL (CENTER APEX)                         */}
          {/* ================================================================ */}
          <div className="flex flex-col justify-center items-center py-4">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#2e43ff]/25 via-black/80 to-black/95 border border-white/20 text-center shadow-2xl w-full">
              <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-[#E8FF1F] font-bold mb-1">
                <Trophy size={13} />
                <span>PARTAI PUNCAK FINAL</span>
              </div>
              <span className="text-[10.5px] text-white/50 block mb-3 font-mono-num">
                Stadion Netral · 1 Laga
              </span>

              {simResult ? (
                <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-black/60 border border-white/10">
                  <div
                    onClick={() => onSelectTeam(simResult.finalistSilver)}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                      simResult.finalistSilver === selectedTeam
                        ? 'bg-[#E8FF1F]/20 text-[#E8FF1F] font-bold'
                        : simResult.champion === simResult.finalistSilver
                          ? 'bg-[#10B981]/25 text-[#10B981] font-bold'
                          : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Monogram code={getMeta(simResult.finalistSilver).code} size="sm" />
                      <span className="truncate text-xs">{simResult.finalistSilver}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono-num text-xs">
                      {simResult.champion === simResult.finalistSilver && (
                        <Trophy size={12} className="text-[#E8FF1F]" />
                      )}
                      <span className="font-bold">{simResult.finalScore[0]}</span>
                    </div>
                  </div>

                  <div
                    onClick={() => onSelectTeam(simResult.finalistBlue)}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                      simResult.finalistBlue === selectedTeam
                        ? 'bg-[#E8FF1F]/20 text-[#E8FF1F] font-bold'
                        : simResult.champion === simResult.finalistBlue
                          ? 'bg-[#10B981]/25 text-[#10B981] font-bold'
                          : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Monogram code={getMeta(simResult.finalistBlue).code} size="sm" />
                      <span className="truncate text-xs">{simResult.finalistBlue}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono-num text-xs">
                      {simResult.champion === simResult.finalistBlue && (
                        <Trophy size={12} className="text-[#E8FF1F]" />
                      )}
                      <span className="font-bold">{simResult.finalScore[1]}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-1.5 text-center text-white/60">
                  <span className="font-bold text-xs text-white">Finalis Silver</span>
                  <span className="text-[10px] font-mono-num text-white/40">vs</span>
                  <span className="font-bold text-xs text-white">Finalis Blue</span>
                </div>
              )}

              <p className="mt-3 text-[10px] text-white/45 leading-tight">
                Peringkat 1 dan 2 terpisah di sisi berlawanan.
              </p>
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 6: SEMIFINAL BLUE (1 TIE)                                    */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Semifinal</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-center flex-1 py-8">
              {(() => {
                const res = simResult?.sfBlue;
                const teamA = simResult ? simResult.qfBlue[0].winner : '';
                const teamB = simResult ? simResult.qfBlue[1].winner : '';

                return (
                  <MatchBox
                    teamA={teamA || 'Pemenang QF 1'}
                    teamB={teamB || 'Pemenang QF 2'}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} ke Final` : 'Lolos ke Partai Puncak'}
                  />
                );
              })()}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 7: PEREMPAT FINAL BLUE (2 TIES)                              */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Perempat Final</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-12 py-6">
              {[0, 1].map((idx) => {
                const res = simResult?.qfBlue[idx];
                const teamA = simResult ? simResult.r16Blue[idx * 2].winner : '';
                const teamB = simResult ? simResult.r16Blue[idx * 2 + 1].winner : '';
                return (
                  <MatchBox
                    key={`qf-blu-${idx}`}
                    teamA={teamA || `Pemenang R16 ${idx * 2 + 1}`}
                    teamB={teamB || `Pemenang R16 ${idx * 2 + 2}`}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} ke SF` : 'Lolos ke Semifinal'}
                  />
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 8: 16 BESAR BLUE (4 TIES)                                    */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>16 Besar (Blue)</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-4 py-2">
              {blueR16Seeds.map((seedRank, idx) => {
                const res = simResult?.r16Blue[idx];
                const poWinner = simResult ? simResult.playoffBlue[idx].winner : '';
                return (
                  <MatchBox
                    key={`r16-blu-${idx}`}
                    teamA={getTeamAtRank(seedRank)}
                    teamB={poWinner || `Pemenang PO #${seedRank}`}
                    badgeA={`#${seedRank}`}
                    badgeB={poWinner ? undefined : 'PO'}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} ke QF` : 'Lolos ke Perempat Final'}
                  />
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* COL 9: PLAYOFF BLUE (4 TIES)                                     */}
          {/* ================================================================ */}
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
              <span>Playoff (Blue)</span>
              <span className="text-[9.5px] font-normal text-white/40 font-mono-num">2 Leg</span>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-4 py-2">
              {bluePlayoffs.map((po, idx) => {
                const res = simResult?.playoffBlue[idx];
                return (
                  <MatchBox
                    key={`po-blu-${idx}`}
                    teamA={po.seedTeam}
                    teamB={po.unseedTeam}
                    badgeA={`#${po.seedRank}`}
                    badgeB={`#${po.unseedRank}`}
                    scoreA={res?.scoreA}
                    scoreB={res?.scoreB}
                    winner={res?.winner}
                    isSimulated={!!res}
                    selectedTeam={selectedTeam}
                    teamMeta={data.team_meta}
                    onSelectTeam={onSelectTeam}
                    note={res ? `Agg. ${res.scoreA}-${res.scoreB} · Lolos` : `Lolos ke R16 #${po.meets}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
