import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Monogram } from './Monogram';
import { GlassSegmented } from './GlassSegmented';
import type { UCLSimulationData, RemainingFixture } from '@/types/ucl';
import { fmtNum, normalizeMatchOdds } from '../../lib/format';
interface FixturesListProps {
  data: UCLSimulationData;
  onSimulateMatch: (fixtureIdx: number) => void;
  className?: string;
}

export const FixturesList: React.FC<FixturesListProps> = ({
  data,
  onSimulateMatch,
  className = '',
}) => {
  const [selectedMatchday, setSelectedMatchday] = useState<'5' | '6' | '7' | '8'>('5');

  const matchdayOptions = [
    { value: '5' as const, label: 'Matchday 5' },
    { value: '6' as const, label: 'Matchday 6' },
    { value: '7' as const, label: 'Matchday 7' },
    { value: '8' as const, label: 'Matchday 8' },
  ];

  const currentFixtures = data.remaining_fixtures
    .map((fix: RemainingFixture, idx: number) => ({ ...fix, globalIdx: idx }))
    .filter((fix) => fix.Matchday === Number(selectedMatchday));

  return (
    <div className={`p-6 rounded-3xl bg-white/[0.03] border border-white/10 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Jadwal 72 Pertandingan Sisa Fase Liga</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            18 pertandingan per matchday lengkap dengan ekspektasi gol (λ dan μ) serta peluang menang, seri, dan kalah model Poisson GLM.
          </p>
        </div>

        <GlassSegmented
          options={matchdayOptions}
          value={selectedMatchday}
          onChange={setSelectedMatchday}
        />
      </div>

      {/* Grid of Matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {currentFixtures.map((fix) => {
          const homeMeta = data.team_meta[fix.HomeTeam] || { code: fix.HomeTeam.slice(0, 3), country: '' };
          const awayMeta = data.team_meta[fix.AwayTeam] || { code: fix.AwayTeam.slice(0, 3), country: '' };
          const odds = normalizeMatchOdds(fix.P_HomeWin, fix.P_Draw, fix.P_AwayWin);
          return (
            <div
              key={`${fix.Matchday}-${fix.HomeTeam}-${fix.AwayTeam}`}
              className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-center justify-between gap-2">
                {/* Home */}
                <div className="flex items-center gap-2 flex-1 truncate">
                  <Monogram code={homeMeta.code} size="sm" />
                  <span className="font-bold text-xs text-white truncate">{fix.HomeTeam}</span>
                </div>

                {/* Expected Score Bubble */}
                <div className="px-2.5 py-1 rounded-lg bg-white/10 font-mono-num text-xs font-bold text-white text-center whitespace-nowrap">
                  {fmtNum(fix.lambda_home, 2)} : {fmtNum(fix.mu_away, 2)}
                </div>

                {/* Away */}
                <div className="flex items-center gap-2 flex-1 justify-end truncate text-right">
                  <span className="font-bold text-xs text-white truncate">{fix.AwayTeam}</span>
                  <Monogram code={awayMeta.code} size="sm" />
                </div>
              </div>

              {/* 3-way probability bar */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                <div className="h-1.5 rounded-full overflow-hidden flex bg-white/10">
                  <div
                    style={{ width: `${odds.homeWidth}%` }}
                    className="bg-[#10B981]"
                    title={`Kandang: ${odds.homeLabel}`}
                  />
                  <div
                    style={{ width: `${odds.drawWidth}%` }}
                    className="bg-white/40"
                    title={`Seri: ${odds.drawLabel}`}
                  />
                  <div
                    style={{ width: `${odds.awayWidth}%` }}
                    className="bg-[#EF4444]"
                    title={`Tandang: ${odds.awayLabel}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono-num text-white/40">
                  <span className="text-[#10B981]">{odds.homeLabel}</span>
                  <span>{odds.drawLabel}</span>
                  <span className="text-[#EF4444]">{odds.awayLabel}</span>
                  <button
                    onClick={() => onSimulateMatch(fix.globalIdx)}
                    className="flex items-center gap-0.5 text-[10.5px] text-[#E8FF1F] hover:underline font-semibold ml-2 cursor-pointer"
                  >
                    <span>Skenariokan</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
