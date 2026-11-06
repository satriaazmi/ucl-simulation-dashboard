import React, { useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Monogram } from './Monogram';
import { DotNumber } from './DotNumber';
import { FunnelBand } from './FunnelBand';
import type { UCLSimulationData } from '@/types/ucl';
import { fmtInt, fmtNum, fmtPct, normalizeMatchOdds } from '../../lib/format';
interface TeamDrawerProps {
  teamName: string | null;
  isOpen: boolean;
  onClose: () => void;
  data: UCLSimulationData;
  onSimulateMatch?: (fixtureIdx: number) => void;
}

export const TeamDrawer: React.FC<TeamDrawerProps> = ({
  teamName,
  isOpen,
  onClose,
  data,
  onSimulateMatch,
}) => {
  const previousOverflow = useRef<string>('');
  const triggerRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables && focusables.length > 0) {
          focusables[0].focus();
        }
      }, 50);

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === 'Tab' && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (!focusables || focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKey);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKey);
        document.body.style.overflow = previousOverflow.current;
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !teamName) return null;

  const teamRow = data.standings_projection.find((t) => t.Team === teamName);
  const teamMeta = data.team_meta[teamName] || { code: teamName.slice(0, 3).toUpperCase(), country: '' };
  const teamElo = data.elo[teamName];
  if (!teamElo) {
    console.warn(`Data Elo tidak ditemukan untuk klub: ${teamName}`);
  }
  const teamOdds = data.champion_odds.find((t) => t.Team === teamName);
  const rankDist = data.rank_distribution[teamName] || Array(36).fill(0);

  // Remaining fixtures involving this team
  const remainingMatches = data.remaining_fixtures
    .map((fix, idx) => ({ ...fix, globalIdx: idx }))
    .filter((fix) => fix.HomeTeam === teamName || fix.AwayTeam === teamName);

  const funnelStages = [
    { name: 'Top 8', shortName: 'Top 8', value: teamRow?.P_Top8_Pct || 0 },
    { name: '16 Besar', shortName: '16 Besar', value: teamRow?.P_R16_Pct || 0 },
    { name: 'Perempat Final', shortName: 'QF', value: teamRow?.P_QF_Pct || 0 },
    { name: 'Semifinal', shortName: 'SF', value: teamRow?.P_SF_Pct || 0 },
    { name: 'Final', shortName: 'Final', value: teamRow?.P_Final_Pct || 0 },
    { name: 'Juara', shortName: 'Juara', value: teamOdds?.P_Champion_Pct || 0 },
  ];

  const maxRankPct = Math.max(...rankDist, 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      {/* Backdrop with Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Floating Center Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-drawer-title"
        className="relative z-10 w-full max-w-2xl bg-[#0e0e13] border border-white/15 rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.95)] max-h-[90vh] flex flex-col overflow-hidden animate-modal-pop"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3.5">
            <Monogram code={teamMeta.code} size="lg" highlight />
            <div>
              <div className="flex items-center gap-2">
                <h3 id="team-drawer-title" className="text-xl font-bold text-white tracking-tight">{teamName}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 font-mono-num font-semibold">
                  {teamMeta.country}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/50 mt-1 font-mono-num">
                <span>Elo: <b className="text-white">{teamElo ? fmtNum(teamElo.elo, 1) : '—'}</b></span>
                <span>•</span>
                <span>Peringkat #{teamElo ? fmtInt(teamElo.rank) : '—'}</span>
                <span>•</span>
                <span>Poin: <b className="text-[#E8FF1F]">{teamRow?.Current_Pts ?? '—'}</b></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-6 overflow-y-auto flex-1">
          {/* Probability Hero Block */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2e43ff]/25 to-black/60 border border-white/10">
            <span className="text-xs text-white/50 uppercase tracking-wider font-semibold block mb-2">
              Peluang Juara UEFA Champions League
            </span>
            <div className="flex items-baseline gap-3">
              <DotNumber
                value={teamOdds ? fmtPct(teamOdds.P_Champion_Pct, 2) : '—'}
                pitch={6.5}
                color="#E8FF1F"
              />
              <span className="text-xs font-mono-num text-white/60">
                Proyeksi akhir: #{teamRow?.Rank ?? '—'}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-2 font-mono-num">
              Ekspektasi poin akhir: {teamRow ? fmtNum(teamRow.Expected_Pts, 2) : '—'} (CI 95%: {teamRow?.CI_95_Pts ?? '—'})
            </p>
          </div>

          {/* Funnel Progression Band */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Progresi Peluang Babak Gugur</span>
              <span className="text-xs text-white/40 font-mono-num">Top 8 hingga Juara</span>
            </h4>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <FunnelBand stages={funnelStages} teamName={teamName} />
            </div>
          </div>

          {/* 1-36 Final Rank Distribution Equalizer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">Distribusi Peringkat Akhir (Posisi 1 - 36)</h4>
              <span className="text-xs font-mono-num text-white/40">50.000 simulasi</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="h-[100px] flex items-end gap-[3px] w-full pt-4">
                {rankDist.map((pct, idx) => {
                  const rank = idx + 1;
                  const heightPercent = pct > 0 ? Math.max(5, (pct / maxRankPct) * 100) : 0;
                  let color = '#EF4444';
                  if (rank <= 8) color = '#10B981';
                  else if (rank <= 24) color = '#60A5FA';

                  return (
                    <div
                      key={rank}
                      className="flex-1 h-full flex items-end relative group cursor-pointer"
                    >
                      {/* Equalizer background track */}
                      <div className="w-full h-full bg-white/[0.04] rounded-t-sm absolute inset-0 pointer-events-none" />

                      {/* Active fill bar */}
                      <div
                        style={{ height: `${heightPercent}%`, backgroundColor: color }}
                        className="w-full rounded-t-sm relative z-10 transition-all duration-300 group-hover:brightness-125"
                      />

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="px-2 py-1 rounded-md bg-black/90 border border-white/20 text-[10px] font-mono-num text-white whitespace-nowrap shadow-lg">
                          #{rank} · {fmtPct(pct, 2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-mono-num text-white/40 mt-2 px-0.5">
                <span>#1 (Juara Liga)</span>
                <span>#8 (Top 8)</span>
                <span>#24 (Playoff)</span>
                <span>#36</span>
              </div>
            </div>
          </div>

          {/* 4 Remaining Fixtures */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Jadwal 4 Laga Tersisa</span>
              <span className="text-xs text-white/40">Matchday 5 s.d. 8</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {remainingMatches.map((fix) => {
                const isHome = fix.HomeTeam === teamName;
                const oppName = isHome ? fix.AwayTeam : fix.HomeTeam;
                const oppMeta = data.team_meta[oppName] || { code: oppName.slice(0, 3).toUpperCase(), country: '' };

                return (
                  <div
                    key={`${fix.Matchday}-${oppName}`}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          MD {fix.Matchday}
                        </span>
                        <span className="text-xs font-semibold text-white/80">
                          {isHome ? 'Kandang vs' : 'Tandang ke'}
                        </span>
                        <Monogram code={oppMeta.code} size="sm" />
                        <span className="text-xs font-bold text-white">{oppName}</span>
                      </div>

                      {onSimulateMatch && (
                        <button
                          onClick={() => {
                            onClose();
                            onSimulateMatch(fix.globalIdx);
                          }}
                          className="flex items-center gap-1 text-[11px] text-[#E8FF1F] hover:underline font-semibold cursor-pointer"
                        >
                          <span>Skenariokan</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>

                    {/* Odds bar */}
                    {(() => {
                      const odds = normalizeMatchOdds(fix.P_HomeWin, fix.P_Draw, fix.P_AwayWin);
                      return (
                        <div className="flex items-center gap-2 text-[10px] font-mono-num">
                          <span className="text-white/50">λ: {fmtNum(fix.lambda_home, 2)}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/50">μ: {fmtNum(fix.mu_away, 2)}</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-white/10 ml-2">
                            <div
                              style={{ width: `${odds.homeWidth}%` }}
                              className="bg-[#10B981]"
                              title={`Menang: ${odds.homeLabel}`}
                            />
                            <div
                              style={{ width: `${odds.drawWidth}%` }}
                              className="bg-white/40"
                              title={`Seri: ${odds.drawLabel}`}
                            />
                            <div
                              style={{ width: `${odds.awayWidth}%` }}
                              className="bg-[#EF4444]"
                              title={`Kalah: ${odds.awayLabel}`}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
