import React from 'react';
import { Monogram } from './Monogram';
import type { UCLSimulationData, StageKey } from '@/types/ucl';
import { fmtPct } from '../../lib/format';
interface ChampionOddsBarProps {
  data: UCLSimulationData;
  activeStage: StageKey;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  className?: string;
}

export const ChampionOddsBar: React.FC<ChampionOddsBarProps> = ({
  data,
  activeStage,
  selectedTeam,
  onSelectTeam,
  className = '',
}) => {
  const getStageValue = (team: string) => {
    const row = data.standings_projection.find((t) => t.Team === team);
    const odds = data.champion_odds.find((t) => t.Team === team);
    if (!row) return 0;
    if (activeStage === 'Champion') return odds?.P_Champion_Pct || 0;
    if (activeStage === 'Final') return row.P_Final_Pct;
    if (activeStage === 'SF') return row.P_SF_Pct;
    if (activeStage === 'QF') return row.P_QF_Pct;
    return row.P_R16_Pct;
  };

  const top15 = [...data.standings_projection]
    .map((t) => ({
      team: t.Team,
      val: getStageValue(t.Team),
      meta: data.team_meta[t.Team] || { code: t.Team.slice(0, 3), country: '' },
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 15);

  const maxVal = Math.max(...top15.map((t) => t.val), 1);

  return (
    <div className={`p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col gap-4 ${className}`}>
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-between">
          <span>Top 15 Kandidat Terkuat ({activeStage})</span>
          <span className="text-xs font-mono-num text-white/40 font-normal">
            Berdasarkan 50.000 simulasi
          </span>
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Persentase probabilitas klub menembus babak terpilih. Klik batang untuk memilih klub.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 mt-2">
        {top15.map((item, idx) => {
          const isSelected = selectedTeam === item.team;
          const barWidth = Math.max(4, (item.val / maxVal) * 100);

          return (
            <div
              key={item.team}
              onClick={() => onSelectTeam(item.team)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {/* Rank and Monogram */}
              <div className="flex items-center gap-2 w-[160px] sm:w-[200px] shrink-0">
                <span className="w-5 text-[11px] font-mono-num text-white/40 text-right">
                  {idx + 1}
                </span>
                <Monogram code={item.meta.code} size="sm" highlight={isSelected} />
                <span
                  className={`text-xs font-bold truncate transition-colors ${
                    isSelected ? 'text-[#E8FF1F]' : 'text-white/80 group-hover:text-white'
                  }`}
                >
                  {item.team}
                </span>
              </div>

              {/* Capsule Horizontal Bar Track */}
              <div className="flex-1 h-5 rounded-full bg-black/40 border border-white/10 p-[2px] overflow-hidden flex items-center">
                <div
                  style={{ width: `${barWidth}%` }}
                  className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isSelected
                      ? 'bg-[#E8FF1F] shadow-[0_0_12px_rgba(232,255,31,0.5)]'
                      : 'bg-white/80 group-hover:bg-white'
                  }`}
                />
              </div>

              {/* Value Text */}
              <span
                className={`w-14 text-right text-xs font-mono-num font-bold shrink-0 ${
                  isSelected ? 'text-[#E8FF1F]' : 'text-white/80'
                }`}
              >
                {fmtPct(item.val, 1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
