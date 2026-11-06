import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { GlassSegmented, type SegmentedOption } from './components/ui/GlassSegmented';
import { BentoGrid } from './components/ui/BentoGrid';
import { StandingsTable } from './components/ui/StandingsTable';
import { ChampionOddsBar } from './components/ui/ChampionOddsBar';
import { BracketView } from './components/ui/BracketView';
import { WhatIfSimulator } from './components/ui/WhatIfSimulator';
import { FixturesList } from './components/ui/FixturesList';
import { MethodologySection } from './components/ui/MethodologySection';
import { TeamDrawer } from './components/ui/TeamDrawer';
import { ScrollReveal } from './components/ui/ScrollReveal';
import rawData from './data/ucl_simulation_results.json';
import type { UCLSimulationData, StageKey } from './types/ucl';
import { validateSimulationData } from './lib/validate';

const simulationData = rawData as unknown as UCLSimulationData;
const validationResult = validateSimulationData(simulationData);

export const App: React.FC = () => {
  const [activeStage, setActiveStage] = useState<StageKey>('Champion');
  const [selectedTeam, setSelectedTeam] = useState<string>('Paris Saint-Germain');
  const [drawerTeam, setDrawerTeam] = useState<string>('Paris Saint-Germain');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [preselectedFixture, setPreselectedFixture] = useState<number | null>(null);
  const stageOptions: SegmentedOption<StageKey>[] = [
    { value: 'Champion', label: 'Juara' },
    { value: 'Final', label: 'Final' },
    { value: 'SF', label: 'Semifinal' },
    { value: 'QF', label: 'Perempat Final' },
    { value: 'R16', label: '16 Besar' },
  ];

  // Khusus pemilihan klub via grafik / kartu "Peluang Juara" (hanya perbarui grafik hero, TANPA popup)
  const handleSelectHeroTeam = (team: string) => {
    setSelectedTeam(team);
    setIsDrawerOpen(false);
  };

  // Klik nama klub di grafik/tabel lain (klasemen, top 15, bagan, What-If, kartu persaingan): tetap munculkan popup
  const handleOpenTeamDrawer = (team: string) => {
    setSelectedTeam(team);
    setDrawerTeam(team);
    setIsDrawerOpen(true);
  };
  const handleSimulateMatch = (fixtureIdx: number) => {
    setPreselectedFixture(fixtureIdx);
    const element = document.getElementById('what-if-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToMethodology = () => {
    const el = document.getElementById('methodology-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (!validationResult.valid) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center font-sans">
        <div className="max-w-lg w-full p-6 rounded-3xl bg-red-950/40 border border-red-500/50 text-red-200">
          <h2 className="text-xl font-bold mb-3 text-white">Validasi Data Gagal</h2>
          <p className="text-xs text-red-300 mb-4">
            Ditemukan inkonsistensi struktur data simulasi:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs font-mono-num">
            {validationResult.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-6 max-w-[1340px] mx-auto flex flex-col gap-8 font-sans">
      {/* TOP HEADER WITH SEGMENTED CONTROLS & DATE                            */}
      {/* ==================================================================== */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>UCL 26/27 Monte Carlo Simulation</span>
            <span className="text-xs sm:text-sm font-normal text-white/40 tracking-normal">
              Diperbarui 5 Nov 2026 · MD 4 selesai
            </span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Simulasi Monte Carlo 50.000 iterasi UEFA Champions League 2026/2027 berbasis Poisson GLM dan Elo dinamis.
          </p>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <GlassSegmented
            options={stageOptions}
            value={activeStage}
            onChange={setActiveStage}
            size="md"
          />


          <button
            onClick={scrollToMethodology}
            className="h-[34px] px-3 rounded-[14px] bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.15] text-xs font-semibold flex items-center gap-1.5 text-white/80 transition-all cursor-pointer"
            title="Pelajari Metodologi"
          >
            <Info size={14} />
            <span className="hidden sm:inline">Metodologi</span>
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* BENTO GRID 9 KARTU UTAMA (MATCHING REFERENCE EXACTLY)                */}
      {/* ==================================================================== */}
      <main className="flex flex-col gap-10">
        <BentoGrid
          data={simulationData}
          activeStage={activeStage}
          selectedTeam={selectedTeam}
          onSelectHeroTeam={handleSelectHeroTeam}
          onSelectTeam={handleOpenTeamDrawer}
        />

        {/* ================================================================== */}
        {/* SECTION 2: TABEL KLASEMEN PROYEKSI INTERAKTIF (36 TIM)             */}
        {/* ================================================================== */}
        <ScrollReveal direction="up" delay={50}>
          <section id="standings-section">
            <StandingsTable
              data={simulationData}
              onSelectTeam={handleOpenTeamDrawer}
            />
          </section>
        </ScrollReveal>
        {/* ================================================================== */}
        {/* SECTION 3: TOP 15 KANDIDAT JUARA & BAGAN FASE GUGUR RESMI UEFA     */}
        {/* ================================================================== */}
        <ScrollReveal direction="up" delay={50}>
          <section className="grid grid-cols-1 gap-6">
            <ChampionOddsBar
              data={simulationData}
              activeStage={activeStage}
              selectedTeam={selectedTeam}
              onSelectTeam={handleOpenTeamDrawer}
            />

            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-4 max-w-full overflow-hidden">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-between">
                  <span>Bagan Fase Gugur Resmi UEFA (Pasal 19)</span>
                  <span className="text-xs font-mono-num text-white/40 font-normal">
                    Playoff dua leg hingga Final netral
                  </span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Pengundian berpasangan berdasarkan peringkat fase liga. Klik klub untuk melihat jalurnya menyala.
                </p>
              </div>

              <BracketView
                data={simulationData}
                selectedTeam={selectedTeam}
                onSelectTeam={handleOpenTeamDrawer}
              />
            </div>
          </section>
        </ScrollReveal>

        {/* ================================================================== */}
        {/* SECTION 4: WHAT-IF MATCH SIMULATOR                                 */}
        {/* ================================================================== */}
        <ScrollReveal direction="up" delay={50}>
          <section id="what-if-section">
            <WhatIfSimulator
              key={preselectedFixture ?? 'default'}
              data={simulationData}
              preselectedFixtureIdx={preselectedFixture}
              onSelectTeam={handleOpenTeamDrawer}
            />
          </section>
        </ScrollReveal>

        {/* ================================================================== */}
        {/* SECTION 5: DAFTAR 72 LAGA SISA (MD 5 - 8)                          */}
        {/* ================================================================== */}
        <ScrollReveal direction="up" delay={50}>
          <section id="fixtures-section">
            <FixturesList
              data={simulationData}
              onSimulateMatch={handleSimulateMatch}
            />
          </section>
        </ScrollReveal>

        {/* ================================================================== */}
        {/* SECTION 6: METODOLOGI DAN DISCLAIMER RESMI                         */}
        {/* ================================================================== */}
        <ScrollReveal direction="up" delay={50}>
          <section id="methodology-section">
            <MethodologySection metadata={simulationData.metadata} />
          </section>
        </ScrollReveal>
      </main>

      {/* ==================================================================== */}
      {/* POPUP DETAIL KLUB (MUNCUL SAAT KLIK KLUB DI GRAFIK / TABEL LAIN)     */}
      {/* ==================================================================== */}
      <TeamDrawer
        teamName={drawerTeam}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={simulationData}
        onSimulateMatch={handleSimulateMatch}
      />
    </div>
  );
};

export default App;
