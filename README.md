# UEFA Champions League 2026/2027 Simulation Dashboard

Dasbor interaktif analisis prediksi dan simulasi stokastik **UEFA Champions League 2026/2027** menggunakan pendekatan **Poisson Generalized Linear Model (GLM)**, **Rating Elo Dinamis Bertanggal**, dan **Simulasi Monte Carlo (50.000 Replikasi Turnamen Penuh)**.

---

## Fitur Utama

- **Bento Grid Analytics:** Ringkasan probabilitas juara, batas poin aman (*magic points* untuk Top 8 dan Playoff), serta persaingan tiket fase gugur.
- **Proyeksi Klasemen 36 Klub:** Tabel klasemen fase liga lengkap dengan estimasi poin akhir (*expected points*), simpangan baku, dan selang kepercayaan 95% ($95\%\text{ CI}$).
- **Bagan Resmi UEFA Berpasangan (*Paired Bracket*):** Visualisasi jalur fase gugur dari babak Playoff, Babak 16 Besar, Perempat Final, Semifinal, hingga Final berdasarkan regulasi resmi UEFA Pasal 19.
- **Simulator Skenario *What-If*:** Simulasi interaktif hasil pertandingan tersisa secara *real-time* di latar belakang menggunakan Web Worker berbasis model Poisson.
- **Jadwal 72 Laga Tersisa:** Eksplorasi probabilitas menang, imbang, kalah, serta estimasi skor tiap pertandingan Matchday 5 hingga 8.
- **Transparansi Metodologi Ilmiah:** Penjabaran metrik deviance, bobot peluruhan waktu eksponensial ($w_i = e^{-\Delta t / 730}$), dan aturan pemecah seri resmi UEFA 6-kriteria.

---

## Tumpukan Teknologi (*Tech Stack*)

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide React
- **Komputasi Klien:** Web Workers (`whatif.worker.ts`) untuk komputasi simulasi Monte Carlo tanpa memblokir rendering UI
- **Pemodelan Data:** Python (Statsmodels, NumPy, Pandas, Scipy)
- **Deployment:** Vercel

---

## Menjalankan Proyek Secara Lokal

1. **Clone repositori:**
   ```bash
   git clone https://github.com/satriaazmi/ucl-simulation-dashboard.git
   cd ucl-simulation-dashboard
   ```

2. **Pasang dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173` pada peramban.

4. **Kompilasi produksi:**
   ```bash
   npm run build
   ```

---

## Sumber Data dan Validasi

Model dilatih menggunakan **2.867 pertandingan resmi kompetisi klub UEFA** (UCL, UEL, UECL, dan kualifikasi) dari musim 2021/2022 hingga Matchday 4 musim 2026/2027 (per 4 November 2026). Evaluasi *out-of-sample* pada 691 laga uji menunjukkan performa Poisson GLM mengungguli *baseline* dengan deviance 1,4376 (kandang) dan 1,4457 (tandang).
