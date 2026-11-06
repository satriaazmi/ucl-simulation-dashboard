import React, { useState, useMemo } from 'react';
import { Play, RotateCcw, X, AlertCircle, Loader2 } from 'lucide-react';
import { Monogram } from './Monogram';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';
import { GlassSegmented, type SegmentedOption } from './GlassSegmented';
import { useWhatIf } from '@/hooks/useWhatIf';
import type { UCLSimulationData, RemainingFixture } from '@/types/ucl';

interface WhatIfSimulatorProps {
  data: UCLSimulationData;
  preselectedFixtureIdx?: number | null;
  onSelectTeam?: (team: string) => void;
  className?: string;
}

type NOption = '2000' | '5000' | '10000' | '20000';

const nOptions: SegmentedOption<NOption>[] = [
  { value: '2000', label: '2.000' },
  { value: '5000', label: '5.000' },
  { value: '10000', label: '10.000' },
  { value: '20000', label: '20.000' },
];

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  data,
  preselectedFixtureIdx,
  onSelectTeam,
  className = '',
}) => {
  // Pre-calculate default fixture where sum of absolute distance to 50% Top8 is minimal
  const defaultFixtureIdx = useMemo(() => {
    const top8Map = Object.fromEntries(
      data.standings_projection.map((t) => [t.Team, t.P_Top8_Pct]),
    );
    let bestIdx = 0;
    let minDiff = Infinity;
    data.remaining_fixtures.forEach((f, idx) => {
      const hTop8 = top8Map[f.HomeTeam] ?? 50;
      const aTop8 = top8Map[f.AwayTeam] ?? 50;
      const diff = Math.abs(hTop8 - 50) + Math.abs(aTop8 - 50);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [data]);

  // Initialize selected fixture from preselected or computed default
  const [selectedIdx, setSelectedIdx] = useState<number>(() =>
    typeof preselectedFixtureIdx === 'number' ? preselectedFixtureIdx : defaultFixtureIdx,
  );

  const [activeN, setActiveN] = useState<NOption>('5000');
  const [overrides, setOverrides] = useState<Record<number, [number, number]>>({});

  const fixture: RemainingFixture =
    data.remaining_fixtures[selectedIdx] || data.remaining_fixtures[0];

  // Current inputs for currently viewed fixture
  const currentOverride = overrides[selectedIdx];
  const [homeScore, setHomeScore] = useState<number>(() => currentOverride ? currentOverride[0] : 2);
  const [awayScore, setAwayScore] = useState<number>(() => currentOverride ? currentOverride[1] : 1);

  const fixtureOptions: DropdownOption<number>[] = useMemo(() => {
    return data.remaining_fixtures.map((fix, idx) => {
      const hasCustom = overrides[idx] !== undefined;
      return {
        value: idx,
        label: `MD ${fix.Matchday}: ${fix.HomeTeam} vs ${fix.AwayTeam}${hasCustom ? ' ★' : ''}`,
        badge: `MD ${fix.Matchday}`,
      };
    });
  }, [data, overrides]);

  const homeMeta = data.team_meta[fixture.HomeTeam] || {
    code: fixture.HomeTeam.slice(0, 3).toUpperCase(),
    country: '',
  };
  const awayMeta = data.team_meta[fixture.AwayTeam] || {
    code: fixture.AwayTeam.slice(0, 3).toUpperCase(),
    country: '',
  };

  const { isSimulating, progress, error, result, run, cancel } = useWhatIf(data);

  // Sync inputs when switching selected fixture
  const handleSelectFixture = (idx: number) => {
    setSelectedIdx(idx);
    const existing = overrides[idx];
    if (existing) {
      setHomeScore(existing[0]);
      setAwayScore(existing[1]);
    } else {
      setHomeScore(2);
      setAwayScore(1);
    }
  };

  const handleApplyCurrentAndSimulate = () => {
    const updatedOverrides = {
      ...overrides,
      [selectedIdx]: [homeScore, awayScore] as [number, number],
    };
    setOverrides(updatedOverrides);
    run(updatedOverrides, parseInt(activeN, 10));
  };

  const handleRemoveOverride = (idx: number) => {
    const next = { ...overrides };
    delete next[idx];
    setOverrides(next);
    if (idx === selectedIdx) {
      setHomeScore(2);
      setAwayScore(1);
    }
    run(next, parseInt(activeN, 10));
  };

  const handleResetAll = () => {
    setOverrides({});
    setHomeScore(2);
    setAwayScore(1);
    run({}, parseInt(activeN, 10));
  };

  // Top 8 clubs with largest absolute change in P_Top8
  const topImpactClubs = useMemo(() => {
    if (!result) return [];
    const entries = Object.keys(data.current_table).map((team) => {
      const base = result.baseline[team];
      const scen = result.scenario[team];
      const deltaTop8 = scen ? scen.p_top8 - (base ? base.p_top8 : 0) : 0;
      const deltaPts = scen ? scen.expected_pts - (base ? base.expected_pts : 0) : 0;
      return {
        team,
        base,
        scen,
        deltaTop8,
        deltaPts,
        absDeltaTop8: Math.abs(deltaTop8),
      };
    });
    return entries.sort((a, b) => b.absDeltaTop8 - a.absDeltaTop8).slice(0, 8);
  }, [data, result]);

  const activeOverridesCount = Object.keys(overrides).length;

  return (
    <div className={`p-6 rounded-3xl bg-white/[0.03] border border-white/10 ${className}`}>
      {/* Header with Title and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Simulator Skenario Pertandingan (What-If)</span>
            {activeOverridesCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8FF1F]/20 text-[#E8FF1F] border border-[#E8FF1F]/30 font-mono-num">
                {activeOverridesCount} skenario aktif
              </span>
            )}
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Simulasi ulang N iterasi dengan skor hipotetis; laga lain tetap acak sesuai model.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Iteration count selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 hidden sm:inline">Iterasi:</span>
            <GlassSegmented<NOption>
              options={nOptions}
              value={activeN}
              onChange={(newN) => {
                setActiveN(newN);
                if (result) {
                  run(overrides, parseInt(newN, 10));
                }
              }}
              size="sm"
            />
          </div>

          {/* Fixture Selector Dropdown */}
          <GlassDropdown<number>
            options={fixtureOptions}
            value={selectedIdx}
            onChange={handleSelectFixture}
            placeholder="Pilih pertandingan..."
            menuClassName="w-80"
          />
        </div>
      </div>

      {/* Active Scenarios List Chips */}
      {activeOverridesCount > 0 && (
        <div className="mb-5 p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/50 font-medium mr-1">Skenario Terpilih:</span>
          {Object.entries(overrides).map(([idxStr, score]) => {
            const fixIdx = Number(idxStr);
            const fix = data.remaining_fixtures[fixIdx];
            if (!fix) return null;
            return (
              <span
                key={fixIdx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-white/15 text-xs font-mono-num text-white/90"
              >
                <span>
                  MD{fix.Matchday} {fix.HomeTeam} {score[0]}-{score[1]} {fix.AwayTeam}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveOverride(fixIdx)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Hapus skenario ini"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs text-[#EF4444] hover:underline ml-auto cursor-pointer flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>Reset Semua</span>
          </button>
        </div>
      )}

      {/* Match Setup & Score Input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-5 rounded-2xl bg-black/40 border border-white/10 mb-6">
        {/* Home Team Input */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div
            onClick={() => onSelectTeam?.(fixture.HomeTeam)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Monogram code={homeMeta.code} size="md" />
            <div>
              <span className="font-bold text-sm text-white block truncate">{fixture.HomeTeam}</span>
              <span className="text-[11px] text-white/40 font-mono-num">
                Kandang (λ: {fixture.lambda_home.toFixed(2)})
              </span>
            </div>
          </div>
          <input
            type="number"
            min={0}
            max={15}
            value={homeScore}
            onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-14 h-11 text-center text-xl font-bold bg-white/10 text-white rounded-xl border border-white/20 outline-none focus:border-[#E8FF1F] font-mono-num"
          />
        </div>

        {/* Action Buttons & Simulation Control */}
        <div className="flex flex-col items-center justify-center gap-2">
          {isSimulating ? (
            <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#E8FF1F] h-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between w-full text-[11px] font-mono-num text-white/60">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-[#E8FF1F]" />
                  <span>Simulasi {progress}%</span>
                </span>
                <button
                  type="button"
                  onClick={cancel}
                  className="text-[#EF4444] hover:underline cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyCurrentAndSimulate}
                className="px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_16px_rgba(232,255,31,0.35)] hover:bg-[#d4eb1a] transition-all cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Simulasikan Skor</span>
              </button>
              {activeOverridesCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  title="Reset Semua Skenario"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          )}

          <span className="text-[10px] text-white/40 font-mono-num">
            Peluang Laga Riil: {(fixture.P_HomeWin * 100).toFixed(0)}% ·{' '}
            {(fixture.P_Draw * 100).toFixed(0)}% · {(fixture.P_AwayWin * 100).toFixed(0)}%
          </span>
        </div>

        {/* Away Team Input */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <input
            type="number"
            min={0}
            max={15}
            value={awayScore}
            onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-14 h-11 text-center text-xl font-bold bg-white/10 text-white rounded-xl border border-white/20 outline-none focus:border-[#E8FF1F] font-mono-num order-2 md:order-1"
          />
          <div
            onClick={() => onSelectTeam?.(fixture.AwayTeam)}
            className="flex items-center gap-2.5 order-1 md:order-2 text-right cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div>
              <span className="font-bold text-sm text-white block truncate">{fixture.AwayTeam}</span>
              <span className="text-[11px] text-white/40 font-mono-num">
                Tandang (μ: {fixture.mu_away.toFixed(2)})
              </span>
            </div>
            <Monogram code={awayMeta.code} size="md" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Simulation Results Section */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* 1. Directly Involved Clubs Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Dampak Pada Klub Yang Bertanding ({result.elapsedMs.toFixed(0)} ms)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team */}
              {(() => {
                const team = fixture.HomeTeam;
                const base = result.baseline[team];
                const scen = result.scenario[team];
                if (!base || !scen) return null;
                const deltaTop8 = scen.p_top8 - base.p_top8;
                const deltaPts = scen.expected_pts - base.expected_pts;

                return (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => onSelectTeam?.(team)}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Monogram code={homeMeta.code} size="sm" />
                        <span className="font-bold text-sm text-white">{team}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono-num">
                        Kandang · Skor: {homeScore}-{awayScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">Ekspektasi Poin</span>
                        <span className="text-white font-bold">
                          {base.expected_pts.toFixed(2)} → {scen.expected_pts.toFixed(2)}
                        </span>
                        <span
                          className={`block text-[11px] font-semibold mt-0.5 ${
                            deltaPts >= 0 ? 'text-[#E8FF1F]' : 'text-[#EF4444]'
                          }`}
                        >
                          {deltaPts >= 0 ? `+${deltaPts.toFixed(2)}` : deltaPts.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">Peluang Lolos Top 8</span>
                        <span className="text-white font-bold">
                          {base.p_top8.toFixed(1)}% → {scen.p_top8.toFixed(1)}%
                        </span>
                        <span
                          className={`block text-[11px] font-semibold mt-0.5 ${
                            deltaTop8 >= 0 ? 'text-[#E8FF1F]' : 'text-[#EF4444]'
                          }`}
                        >
                          {deltaTop8 >= 0 ? `+${deltaTop8.toFixed(1)}%` : `${deltaTop8.toFixed(1)}%`}
                          <span className="text-white/40 font-normal ml-1 text-[10px]">
                            (±{scen.se_top8.toFixed(1)} pp)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Away Team */}
              {(() => {
                const team = fixture.AwayTeam;
                const base = result.baseline[team];
                const scen = result.scenario[team];
                if (!base || !scen) return null;
                const deltaTop8 = scen.p_top8 - base.p_top8;
                const deltaPts = scen.expected_pts - base.expected_pts;

                return (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => onSelectTeam?.(team)}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Monogram code={awayMeta.code} size="sm" />
                        <span className="font-bold text-sm text-white">{team}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono-num">
                        Tandang · Skor: {homeScore}-{awayScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">Ekspektasi Poin</span>
                        <span className="text-white font-bold">
                          {base.expected_pts.toFixed(2)} → {scen.expected_pts.toFixed(2)}
                        </span>
                        <span
                          className={`block text-[11px] font-semibold mt-0.5 ${
                            deltaPts >= 0 ? 'text-[#E8FF1F]' : 'text-[#EF4444]'
                          }`}
                        >
                          {deltaPts >= 0 ? `+${deltaPts.toFixed(2)}` : deltaPts.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-white/40 block text-[10px]">Peluang Lolos Top 8</span>
                        <span className="text-white font-bold">
                          {base.p_top8.toFixed(1)}% → {scen.p_top8.toFixed(1)}%
                        </span>
                        <span
                          className={`block text-[11px] font-semibold mt-0.5 ${
                            deltaTop8 >= 0 ? 'text-[#E8FF1F]' : 'text-[#EF4444]'
                          }`}
                        >
                          {deltaTop8 >= 0 ? `+${deltaTop8.toFixed(1)}%` : `${deltaTop8.toFixed(1)}%`}
                          <span className="text-white/40 font-normal ml-1 text-[10px]">
                            (±{scen.se_top8.toFixed(1)} pp)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 2. Top 8 Clubs with Largest P_Top8 Impact */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                8 Klub dengan Perubahan Peluang Top 8 Terbesar
              </span>
              <span className="text-[11px] text-white/40 font-mono-num">
                Berdasarkan {parseInt(activeN, 10).toLocaleString('id-ID')} iterasi Monte Carlo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topImpactClubs.map(({ team, base, scen, deltaTop8 }) => {
                if (!base || !scen) return null;
                const meta = data.team_meta[team] || { code: team.slice(0, 3).toUpperCase() };
                const isPositive = deltaTop8 > 0;
                const isZero = Math.abs(deltaTop8) < 0.01;

                return (
                  <div
                    key={team}
                    onClick={() => onSelectTeam?.(team)}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <Monogram code={meta.code} size="sm" />
                        <span className="text-xs font-bold text-white truncate">{team}</span>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono-num px-1.5 py-0.5 rounded-md ${
                          isZero
                            ? 'text-white/40 bg-white/5'
                            : isPositive
                              ? 'text-[#E8FF1F] bg-[#E8FF1F]/10'
                              : 'text-[#EF4444] bg-[#EF4444]/10'
                        }`}
                      >
                        {isZero ? '0,0%' : isPositive ? `+${deltaTop8.toFixed(1)}%` : `${deltaTop8.toFixed(1)}%`}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-[11px] font-mono-num text-white/50 pt-1 border-t border-white/5">
                      <span>
                        {base.p_top8.toFixed(1)}% →{' '}
                        <strong className="text-white font-semibold">{scen.p_top8.toFixed(1)}%</strong>
                      </span>
                      <span className="text-[10px] text-white/30">
                        ±{scen.se_top8.toFixed(1)} pp
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
