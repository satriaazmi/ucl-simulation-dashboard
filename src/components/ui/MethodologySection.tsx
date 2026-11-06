import React from 'react';
import { Database, Cpu, Award, ShieldAlert } from 'lucide-react';
import type { SimulationMetadata } from '@/types/ucl';
import { fmtInt, fmtNum } from '../../lib/format';

interface MethodologySectionProps {
  metadata: SimulationMetadata;
  className?: string;
}

export const MethodologySection: React.FC<MethodologySectionProps> = ({
  metadata,
  className = '',
}) => {
  return (
    <div className={`p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-6 ${className}`}>
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Metodologi Ilmiah & Landasan Komputasi</span>
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Rincian matematis pemodelan statistik, evaluasi validasi berurutan waktu, dan mesin simulasi stokastik.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#60A5FA]">
            <Database size={16} />
            <span className="font-bold uppercase tracking-wider text-[11px]">Dataset Tingkat Laga</span>
          </div>
          <p className="text-white/70 leading-relaxed">
            Dilatih menggunakan <b>{fmtInt(metadata.total_training_matches)} pertandingan resmi</b> kompetisi klub UEFA (UCL, UEL, UECL, dan kualifikasi) dari musim 2021/2022 hingga Matchday 4 musim 2026/2027.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#E8FF1F]">
            <Cpu size={16} />
            <span className="font-bold uppercase tracking-wider text-[11px]">Model Poisson GLM</span>
          </div>
          <p className="text-white/70 leading-relaxed">
            Regresi Poisson dengan fungsi penghubung logaritmik dan bobot peluruhan waktu eksponensial (waktu paruh 2 tahun). Menghasilkan deviance out-of-sample <b>{fmtNum(metadata.test_deviance.glm_home, 4)}</b> vs <b>{fmtNum(metadata.test_deviance.baseline_home, 4)}</b> baseline pada <b>{fmtInt(metadata.test_matches)} laga uji</b>.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#10B981]">
            <Award size={16} />
            <span className="font-bold uppercase tracking-wider text-[11px]">Regulasi Resmi UEFA</span>
          </div>
          <p className="text-white/70 leading-relaxed">
            Menerapkan pemecah seri 6 kriteria (Poin, Selisih Gol, Gol Masuk, Gol Tandang, Kemenangan, Kemenangan Tandang, Koefisien UEFA) serta bagan fase gugur berpasangan (Pasal 19).
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#EF4444]">
            <ShieldAlert size={16} />
            <span className="font-bold uppercase tracking-wider text-[11px]">Batasan Model</span>
          </div>
          <p className="text-white/70 leading-relaxed">
            Model mengasumsikan kekuatan tim konstan selama sisa 4 laga tanpa memperhitungkan cedera mendadak atau kartu merah. Seluruh angka adalah probabilitas empiris dari {fmtInt(metadata.n_simulations)} iterasi.
          </p>
        </div>
      </div>

      {/* Prominent Footer Credit */}
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#E8FF1F] animate-pulse" />
          <span className="text-xs text-white/90 font-semibold">
            Developed by Satria 'Azmi · Proyeksi probabilistik berbasis model stokastik.
          </span>
        </div>
        <span className="text-[11px] font-mono-num text-white/40">
          Teknik Simulasi · FSM Universitas Diponegoro · 2026
        </span>
      </div>
    </div>
  );
};
