import React, { useState, useMemo } from 'react';
import { TrendingUp, Award, Database, Calendar } from 'lucide-react';
import { BentoCard } from './BentoCard';
import { DotNumber } from './DotNumber';
import { TickGauge } from './TickGauge';
import { TickBar } from './TickBar';
import { Monogram } from './Monogram';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { GlassSegmented } from './GlassSegmented';
import { CapsuleColumns, type CapsuleItem } from './CapsuleColumns';
import { FunnelBand, type FunnelStage } from './FunnelBand';
import { MirroredWave } from './MirroredWave';
import type { UCLSimulationData, StageKey } from '@/types/ucl';
import { fmtInt, fmtNum, fmtPct } from '../../lib/format';
import { TOP8_ZONE, PLAYOFF_ZONE, ELIMINATION_ZONE, getZoneArrow } from '../../lib/zones';
interface BentoGridProps {
  data: UCLSimulationData;
  activeStage: StageKey;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  onSelectHeroTeam?: (team: string) => void;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  data,
  activeStage,
  selectedTeam,
  onSelectTeam,
  onSelectHeroTeam,
  className = '',
}) => {
  const [selectedExplorerPoint, setSelectedExplorerPoint] = useState<number>(16);

  // Selected team data
  const teamRow = data.standings_projection.find((t) => t.Team === selectedTeam) || data.standings_projection[0];
  const teamMeta = data.team_meta[teamRow.Team] || { code: teamRow.Team.slice(0, 3), country: '' };
  const teamOdds = data.champion_odds.find((t) => t.Team === teamRow.Team);

  const teamOptions: DropdownOption[] = useMemo(() => {
    return data.standings_projection.map((t) => ({
      value: t.Team,
      label: `#${t.Rank} ${t.Team}`,
      code: data.team_meta[t.Team]?.code || t.Team.slice(0, 3).toUpperCase(),
      badge: `${t.Current_Pts} Pts`,
    }));
  }, [data]);

  // Stage value for selected team
  const stageProbability = {
    Champion: teamOdds?.P_Champion_Pct || 0,
    Final: teamRow.P_Final_Pct,
    SF: teamRow.P_SF_Pct,
    QF: teamRow.P_QF_Pct,
    R16: teamRow.P_R16_Pct,
  }[activeStage];

  // Stage label indonesian
  const stageLabel = {
    Champion: 'Peluang Juara',
    Final: 'Peluang Menembus Final',
    SF: 'Peluang Menembus Semifinal',
    QF: 'Peluang Menembus Perempat Final',
    R16: 'Peluang Menembus 16 Besar',
  }[activeStage];

  // Funnel stages for hero card
  const funnelStages: FunnelStage[] = [
    { name: 'Top 8', shortName: 'Top 8', value: teamRow.P_Top8_Pct },
    { name: '16 Besar', shortName: '16 Besar', value: teamRow.P_R16_Pct },
    { name: 'Perempat Final', shortName: 'QF', value: teamRow.P_QF_Pct },
    { name: 'Semifinal', shortName: 'SF', value: teamRow.P_SF_Pct },
    { name: 'Final', shortName: 'Final', value: teamRow.P_Final_Pct },
    { name: 'Juara', shortName: 'Juara', value: teamOdds?.P_Champion_Pct || 0 },
  ];

  // Teams in standings order for TickGauge
  const orderedTeams = data.standings_projection.map((t) => t.Team);

  // Bubble teams (Ranks 8 - 12)
  const bubbleTeams = data.standings_projection.filter((t) => t.Rank >= 8 && t.Rank <= 11);

  // Top 5 Candidates based on active stage
  const top5Teams = [...data.standings_projection]
    .sort((a, b) => {
      if (activeStage === 'Champion') return b.P_Champion_Pct - a.P_Champion_Pct;
      if (activeStage === 'Final') return b.P_Final_Pct - a.P_Final_Pct;
      if (activeStage === 'SF') return b.P_SF_Pct - a.P_SF_Pct;
      if (activeStage === 'QF') return b.P_QF_Pct - a.P_QF_Pct;
      return b.P_R16_Pct - a.P_R16_Pct;
    })
    .slice(0, 5);

  const capsuleItems: CapsuleItem[] = top5Teams.map((t) => {
    const meta = data.team_meta[t.Team] || { code: t.Team.slice(0, 3), country: '' };
    let val = t.P_Champion_Pct;
    if (activeStage === 'Final') val = t.P_Final_Pct;
    if (activeStage === 'SF') val = t.P_SF_Pct;
    if (activeStage === 'QF') val = t.P_QF_Pct;
    if (activeStage === 'R16') val = t.P_R16_Pct;

    return {
      id: t.Team,
      label: t.Team,
      code: meta.code,
      value: val,
      displayValue: fmtPct(val, 1),
    };
  });

  return (
    <div className={`grid grid-cols-12 gap-3.5 ${className}`}>
      {/* ==================================================================== */}
      {/* ROW 1 - CARD 1 (HERO NET WORTH EQUIVALENT: PELUANG JUARA / TAHAP)    */}
      {/* ==================================================================== */}
      <BentoCard
        variant="blue"
        id="nw"
        className="col-span-12 xl:col-span-8 h-auto min-h-[376px] xl:h-[376px]"
      >
        <div className="flex flex-col justify-between h-full">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Monogram code={teamMeta.code} size="md" highlight />
              <div>
                <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{stageLabel}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-white/80 border border-white/10 font-mono-num font-normal">
                    {teamRow.Team}
                  </span>
                </span>
                <span className="text-xs text-white/60">Proyeksi klasemen akhir fase liga #{teamRow.Rank}</span>
              </div>
            </div>

            {/* Team Selector Dropdown */}
            <div className="flex items-center gap-2">
              <GlassDropdown
                options={teamOptions}
                value={selectedTeam}
                onChange={onSelectHeroTeam || onSelectTeam}
                placeholder="Pilih klub..."
                menuClassName="w-72"
              />

              <span className="text-xs px-2.5 py-1.5 rounded-xl bg-black/40 text-white/80 border border-white/10 font-mono-num hidden sm:inline-block">
                {data.elo[teamRow.Team] ? `Elo ${fmtNum(data.elo[teamRow.Team].elo, 1)}` : 'Elo —'}
              </span>
            </div>
          </div>

          {/* Number & Delta */}
          <div className="flex flex-wrap items-baseline gap-4 mt-2">
            <DotNumber
              value={fmtPct(stageProbability, 2)}
              pitch={7}
              color="#ffffff"
            />
            <div className="flex flex-col">
              <span className="text-[#E8FF1F] text-xs font-mono-num font-bold tracking-tight">
                {getZoneArrow(teamRow.Rank)} Peringkat #{teamRow.Rank} dari 36
              </span>
              <span className="text-xs text-white/60 font-mono-num mt-0.5">
                Ekspektasi: {fmtNum(teamRow.Expected_Pts, 2)} Poin (CI: {teamRow.CI_95_Pts})
              </span>
            </div>
          </div>

          {/* Stream Wave Funnel Band */}
          <div className="mt-1">
            <FunnelBand stages={funnelStages} teamName={teamRow.Team} />
          </div>
        </div>
      </BentoCard>

      {/* ==================================================================== */}
      {/* ROW 1 - CARD 2 (ALLOCATION EQUIVALENT: PETA ZONA 36 KLUB)            */}
      {/* ==================================================================== */}
      <BentoCard
        variant="graph"
        id="alloc"
        className="col-span-12 xl:col-span-4 h-auto min-h-[376px] xl:h-[376px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white tracking-tight">Peta Zona Kualifikasi</span>
            <span className="text-[11px] font-mono-num font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
              MD 4 dari 8
            </span>
          </div>

          {/* 36-Tick Circular Half Gauge */}
          <div className="my-auto">
            <TickGauge
              totalClubs={36}
              top8Count={8}
              playoffCount={16}
              teamsOrdered={orderedTeams}
            />
          </div>

          {/* Zone Breakdown Rows */}
          <div className="flex flex-col gap-1 border-t border-white/10 pt-2.5">
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <i className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-semibold text-white">Top 8 (16 Besar Langsung)</span>
              </div>
              <span className="font-mono-num text-white/70">{TOP8_ZONE.count} Klub</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-white/5">
              <div className="flex items-center gap-2">
                <i className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                <span className="font-semibold text-white">Playoff Fase Gugur</span>
              </div>
              <span className="font-mono-num text-white/70">{PLAYOFF_ZONE.count} Klub</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-white/5">
              <div className="flex items-center gap-2">
                <i className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="font-semibold text-white">Zona Eliminasi</span>
              </div>
              <span className="font-mono-num text-white/70">{ELIMINATION_ZONE.count} Klub</span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* ==================================================================== */}
      {/* ROW 2 - 4 KPI TILES (HEIGHT: 168px)                                  */}
      {/* ==================================================================== */}

      {/* KPI 1: Magic Points Top 8 (LIME GRADIENT - TEXT DARK) */}
      <BentoCard
        variant="lime"
        className="col-span-12 sm:col-span-6 lg:col-span-3 h-auto min-h-[168px] lg:h-[168px]"
      >
        <div className="flex flex-col justify-between h-full text-black">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/60">
              MAGIC POINTS TOP 8
            </span>
            <span className="text-[10.5px] font-mono-num font-bold px-2 py-0.5 rounded-full bg-black/15 text-black">
              median {fmtInt(data.magic_points.top8_median)}
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-4xl font-extralight tracking-tight font-mono-num">
              ↑ {fmtInt(data.magic_points.top8_safe_95pct)}
            </span>
            <span className="text-sm font-semibold text-black/70">poin</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-black/80">
            <TrendingUp size={14} />
            <span>≥95% jaminan lolos langsung</span>
          </div>
        </div>
      </BentoCard>

      {/* KPI 2: Magic Points Playoff (GLASS) */}
      <BentoCard
        variant="glass"
        className="col-span-12 sm:col-span-6 lg:col-span-3 h-auto min-h-[168px] lg:h-[168px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              MAGIC POINTS PLAYOFF
            </span>
            <span className="text-[10.5px] font-mono-num font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              median {fmtInt(data.magic_points.playoff_median)}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-4xl font-extralight text-white tracking-tight font-mono-num">
              {fmtInt(data.magic_points.playoff_safe_95pct)}
            </span>
            <span className="text-sm font-semibold text-white/50">poin</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <TickBar
              totalTicks={25}
              activeTicks={data.magic_points.playoff_safe_95pct}
              activeColor="#E8FF1F"
            />
            <span className="text-[11px] text-white/50 font-mono-num">
              ≥95% aman dari eliminasi
            </span>
          </div>
        </div>
      </BentoCard>

      {/* KPI 3: Model Metrics (GLASS - LIST STYLE) */}
      <BentoCard
        variant="glass"
        className="col-span-12 sm:col-span-6 lg:col-span-3 h-auto min-h-[168px] lg:h-[168px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              MODEL PREDIKSI
            </span>
            <Database size={13} className="text-[#60A5FA]" />
          </div>

          <div className="flex flex-col gap-1.5 text-xs font-mono-num my-auto">
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-white/60">Simulasi</span>
              <span className="font-bold text-white">{fmtInt(data.metadata.n_simulations)}</span>
            </div>
            <div className="flex items-center justify-between py-0.5 border-b border-white/5">
              <span className="text-white/60">Laga Latih</span>
              <span className="font-bold text-white">{fmtInt(data.metadata.total_training_matches)}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-white/60">Deviance GLM</span>
              <span className="font-bold text-[#E8FF1F]">{fmtNum(data.metadata.test_deviance.glm_home, 4)}</span>
            </div>
          </div>

          <span className="text-[10.5px] text-white/40">
            Out-of-sample test {fmtInt(data.metadata.test_matches)} laga Eropa
          </span>
        </div>
      </BentoCard>

      {/* KPI 4: Progress Musim (GLASS) */}
      <BentoCard
        variant="glass"
        className="col-span-12 sm:col-span-6 lg:col-span-3 h-auto min-h-[168px] lg:h-[168px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              PROGRES MUSIM
            </span>
            <Calendar size={13} className="text-[#10B981]" />
          </div>

          <div className="flex flex-col gap-2 my-auto">
            <div>
              <div className="flex justify-between text-xs font-mono-num mb-1">
                <span className="text-white/70">Matchday 4 dari 8</span>
                <span className="text-white font-bold">50%</span>
              </div>
              <TickBar totalTicks={8} activeTicks={4} activeColor="#10B981" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono-num mb-1">
                <span className="text-white/70">
                  {fmtInt(Object.values(data.current_table).reduce((acc, t) => acc + t.P, 0) / 2)} dari {fmtInt((36 * 8) / 2)} Laga Selesai
                </span>
                <span className="text-white font-bold">50%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="w-1/2 h-full bg-[#10B981]" />
              </div>
            </div>
          </div>

          <span className="text-[10.5px] text-white/40">
            72 laga sisa disimulasikan
          </span>
        </div>
      </BentoCard>

      {/* ==================================================================== */}
      {/* ROW 3 - 3 CARDS (HEIGHT: 330px)                                      */}
      {/* ==================================================================== */}

      {/* Card 7: Magic Points Explorer (PINK GRADIENT) */}
      <BentoCard
        variant="pink"
        className="col-span-12 lg:col-span-5 h-auto min-h-[330px] lg:h-[330px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-white tracking-tight block">
                Magic Points Explorer
              </span>
              <span className="text-xs text-white/70">
                Peluang Kumulatif Lolos Top 8 vs Playoff
              </span>
            </div>
            <GlassSegmented<string>
              options={[
                { value: '14', label: '14' },
                { value: '15', label: '15' },
                { value: '16', label: '16' },
                { value: '17', label: '17' },
              ]}
              value={String(selectedExplorerPoint)}
              onChange={(val: string) => setSelectedExplorerPoint(parseInt(val, 10))}
              size="sm"
            />
          </div>

          {/* Mirrored Wave Graph */}
          <div className="my-auto">
            <MirroredWave
              top8Cdf={data.magic_points.top8_cdf}
              playoffCdf={data.magic_points.playoff_cdf}
              selectedPoints={selectedExplorerPoint}
              onSelectPoints={setSelectedExplorerPoint}
            />
          </div>

          {/* Dynamic Summary Statement */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <span className="text-white/80 font-mono-num">
              Dengan <b>{selectedExplorerPoint} Poin</b>:
            </span>
            <span className="text-[#E8FF1F] font-mono-num font-bold">
              {fmtPct(data.magic_points.top8_secure[selectedExplorerPoint], 1)} lolos Top 8
            </span>
          </div>
        </div>
      </BentoCard>

      {/* Card 8: Bubble Teams (COPPER GRADIENT) */}
      <BentoCard
        variant="copper"
        className="col-span-12 sm:col-span-6 lg:col-span-4 h-auto min-h-[330px] lg:h-[330px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-white tracking-tight block">
                Zona Persaingan Sengit
              </span>
              <span className="text-xs text-white/70">Klub Papan Tengah (Peringkat 8 - 11)</span>
            </div>
            <span className="text-[10.5px] font-mono-num px-2 py-0.5 rounded-full bg-black/40 text-white border border-white/10">
              Median Top 8: {fmtInt(data.magic_points.top8_median)}
            </span>
          </div>

          {/* List of 4 Bubble Teams */}
          <div className="flex flex-col gap-1.5 my-auto">
            {bubbleTeams.map((team) => {
              const meta = data.team_meta[team.Team] || { code: team.Team.slice(0, 3), country: '' };
              const isSelected = selectedTeam === team.Team;

              return (
                <div
                  key={team.Team}
                  onClick={() => onSelectTeam(team.Team)}
                  className={`p-1.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-black/60 border border-[#E8FF1F]/50 shadow-md'
                      : 'bg-black/30 hover:bg-black/40 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Monogram code={meta.code} size="sm" highlight={isSelected} />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold text-white truncate">{team.Team}</span>
                      <span className="text-[10px] text-white/50 font-mono-num">
                        Exp {fmtNum(team.Expected_Pts, 1)} Pts
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono-num">
                    <span className="text-xs font-bold text-[#E8FF1F] block">
                      {fmtPct(team.P_Top8_Pct, 1)}
                    </span>
                    <span className="text-[9.5px] text-white/50">Top 8</span>
                  </div>
                </div>
              );
            })}
          </div>

          <span className="text-[10.5px] text-white/50 font-mono-num">
            P_Top8 klub-klub ini berkisar {fmtNum(Math.min(...bubbleTeams.map((t) => t.P_Top8_Pct)), 1)}%–{fmtNum(Math.max(...bubbleTeams.map((t) => t.P_Top8_Pct)), 1)}%
          </span>
        </div>
      </BentoCard>

      {/* Card 9: Top 5 Kandidat (GREEN GRADIENT) */}
      <BentoCard
        variant="green"
        className="col-span-12 sm:col-span-6 lg:col-span-3 h-auto min-h-[330px] lg:h-[330px]"
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white tracking-tight">
              Top 5 Kandidat
            </span>
            <Award size={14} className="text-[#E8FF1F]" />
          </div>

          <p className="text-xs text-white/70">
            Peluang tertinggi pada tahap: <b>{activeStage}</b>
          </p>

          {/* Vertical Capsule Columns */}
          <div className="my-auto">
            <CapsuleColumns
              items={capsuleItems}
              selectedId={selectedTeam}
              onSelect={onSelectTeam}
              height={140}
            />
          </div>

          <span className="text-[10px] text-white/50 text-center font-mono-num">
            Klik kapsul untuk memilih klub
          </span>
        </div>
      </BentoCard>
    </div>
  );
};
