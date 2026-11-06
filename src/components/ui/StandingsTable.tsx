import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Monogram } from './Monogram';
import { GlassSegmented, type SegmentedOption } from './GlassSegmented';
import type { UCLSimulationData, StandingProjection, ZoneKey } from '@/types/ucl';
import { fmtNum, fmtPct } from '../../lib/format';

interface StandingsTableProps {
  data: UCLSimulationData;
  activeZone?: ZoneKey;
  onSelectTeam: (team: string) => void;
  className?: string;
}

type SortField =
  | 'Rank'
  | 'Current_Pts'
  | 'Expected_Pts'
  | 'P_Top8_Pct'
  | 'P_Playoff_Pct'
  | 'P_Elim_Pct'
  | 'P_R16_Pct'
  | 'P_Champion_Pct';

const zoneOptions: SegmentedOption<ZoneKey>[] = [
  { value: 'All', label: 'Semua' },
  { value: 'Top8', label: 'Top 8' },
  { value: 'Bubble', label: 'Bubble' },
  { value: 'Elimination', label: 'Eliminasi' },
];

export const StandingsTable: React.FC<StandingsTableProps> = ({
  data,
  activeZone = 'All',
  onSelectTeam,
  className = '',
}) => {
  const [currentZone, setCurrentZone] = useState<ZoneKey>(activeZone);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('Rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isSummarizedToTop8, setIsSummarizedToTop8] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'Rank');
    }
  };

  const filteredTeams = useMemo(() => {
    return data.standings_projection.filter((t) => {
      // 1. Text search
      const meta = data.team_meta[t.Team] || { code: '', country: '' };
      const matchesSearch =
        t.Team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.country.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Zone filter
      // P_Elim = 100 - P_Top8 - P_Playoff
      const pElim = Math.max(0, 100 - t.P_Top8_Pct - t.P_Playoff_Pct);

      if (currentZone === 'Top8') {
        return t.P_Top8_Pct >= 10.0;
      }
      if (currentZone === 'Bubble') {
        return t.P_Playoff_Pct >= 10.0 && pElim >= 10.0;
      }
      if (currentZone === 'Elimination') {
        return pElim >= 50.0;
      }

      return true;
    });
  }, [data, searchQuery, currentZone]);

  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      let valA: number;
      let valB: number;

      if (sortField === 'P_Elim_Pct') {
        valA = Math.max(0, 100 - a.P_Top8_Pct - a.P_Playoff_Pct);
        valB = Math.max(0, 100 - b.P_Top8_Pct - b.P_Playoff_Pct);
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTeams, sortField, sortAsc]);

  // Default displays ALL 36 teams; user can optionally summarize to Top 8
  const displayedTeams = useMemo(() => {
    if (isSummarizedToTop8 && !searchQuery && currentZone === 'All') {
      return sortedTeams.slice(0, 8);
    }
    return sortedTeams;
  }, [sortedTeams, isSummarizedToTop8, searchQuery, currentZone]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Search & Zone Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Tabel Proyeksi Klasemen Akhir Fase Liga (36 Klub)</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Diurutkan berdasarkan regulasi resmi UEFA 6 kriteria: Poin, Selisih Gol, Gol Masuk, Gol Tandang, Kemenangan, Kemenangan Tandang, Koefisien.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono-num text-white/50">
            Menampilkan {filteredTeams.length} dari 36 klub
          </span>

          <GlassSegmented<ZoneKey>
            options={zoneOptions}
            value={currentZone}
            onChange={setCurrentZone}
            size="sm"
          />

          <div className="relative min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari klub atau kode..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#E8FF1F] transition-all font-mono-num"
            />
          </div>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] max-h-[640px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-[#0e0e14] shadow-md">
            <tr className="border-b border-white/10 text-[11px] font-semibold text-white/50 uppercase tracking-wider select-none">
              <th
                aria-sort={sortField === 'Rank' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort('Rank')}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                >
                  <span className={sortField === 'Rank' ? 'text-[#E8FF1F]' : ''}>#</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3.5">Klub</th>
              <th
                aria-sort={sortField === 'Current_Pts' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleSort('Current_Pts')}
                  className="flex items-center justify-center gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'Current_Pts' ? 'text-[#E8FF1F]' : ''}>Poin Riil</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th
                aria-sort={sortField === 'Expected_Pts' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleSort('Expected_Pts')}
                  className="flex items-center justify-center gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'Expected_Pts' ? 'text-[#E8FF1F]' : ''}>Exp Pts (±SD)</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th
                aria-sort={sortField === 'P_Top8_Pct' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort('P_Top8_Pct')}
                  className="flex items-center justify-end gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'P_Top8_Pct' ? 'text-[#E8FF1F]' : ''}>Top 8 (Langsung)</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th
                aria-sort={sortField === 'P_Playoff_Pct' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort('P_Playoff_Pct')}
                  className="flex items-center justify-end gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'P_Playoff_Pct' ? 'text-[#E8FF1F]' : ''}>Playoff</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th
                aria-sort={sortField === 'P_Elim_Pct' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort('P_Elim_Pct')}
                  className="flex items-center justify-end gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'P_Elim_Pct' ? 'text-[#E8FF1F]' : ''}>Eliminasi</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th
                aria-sort={sortField === 'P_R16_Pct' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3.5 text-right hidden sm:table-cell"
              >
                <button
                  type="button"
                  onClick={() => handleSort('P_R16_Pct')}
                  className="flex items-center justify-end gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'P_R16_Pct' ? 'text-[#E8FF1F]' : ''}>P(16 Besar)</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th
                aria-sort={sortField === 'P_Champion_Pct' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                className="py-3 px-3.5 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort('P_Champion_Pct')}
                  className="flex items-center justify-end gap-1 w-full cursor-pointer hover:text-white transition-colors font-mono-num"
                >
                  <span className={sortField === 'P_Champion_Pct' ? 'text-[#E8FF1F]' : ''}>P(Juara)</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {displayedTeams.map((team: StandingProjection) => {
              const meta = data.team_meta[team.Team] || { code: team.Team.slice(0, 3).toUpperCase(), country: '' };
              const pElim = Math.max(0, 100 - team.P_Top8_Pct - team.P_Playoff_Pct);

              // Border indicator color per projected position
              let zoneBorderColor = 'border-l-transparent';
              if (team.Rank <= 8) zoneBorderColor = 'border-l-[#10B981]';
              else if (team.Rank <= 24) zoneBorderColor = 'border-l-[#60A5FA]';
              else zoneBorderColor = 'border-l-[#EF4444]';

              return (
                <tr
                  key={team.Team}
                  tabIndex={0}
                  role="button"
                  onClick={() => onSelectTeam(team.Team)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTeam(team.Team);
                    }
                  }}
                  className={`border-b border-white/[0.06] hover:bg-white/[0.05] focus:bg-white/[0.08] focus:outline-none transition-colors cursor-pointer border-l-[3.5px] ${zoneBorderColor} animate-row-expand`}
                >
                  <td className="py-3 px-3.5 font-mono-num font-bold text-white/70">
                    #{team.Rank}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <Monogram code={meta.code} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-[12.5px] truncate max-w-[170px] sm:max-w-[220px]">
                          {team.Team}
                        </span>
                        <span className="text-[10px] text-white/40">{meta.country}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono-num text-center font-bold text-white">
                    {team.Current_Pts}
                  </td>
                  <td className="py-3 px-3 font-mono-num text-center">
                    <span className="text-white font-bold">{fmtNum(team.Expected_Pts, 2)}</span>
                    <span className="text-[10.5px] text-white/40 block">±{fmtNum(team.SD_Pts, 1)}</span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono-num">
                    <span className="font-bold text-[#10B981]">{fmtPct(team.P_Top8_Pct, 1)}</span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono-num">
                    <span className="font-bold text-[#60A5FA]">{fmtPct(team.P_Playoff_Pct, 1)}</span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono-num">
                    <span className="font-bold text-[#EF4444]">{fmtPct(pElim, 1)}</span>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono-num text-white/80 hidden sm:table-cell">
                    {fmtPct(team.P_R16_Pct, 1)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono-num font-bold text-[#E8FF1F]">
                    {fmtPct(team.P_Champion_Pct, 1)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
                      aria-label={`Buka detail ${team.Team}`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expand / Summarize Toggle Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsSummarizedToTop8(!isSummarizedToTop8)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>{isSummarizedToTop8 ? 'Tampilkan Semua 36 Klub' : 'Ringkas ke Top 8'}</span>
          {isSummarizedToTop8 ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </div>
  );
};
