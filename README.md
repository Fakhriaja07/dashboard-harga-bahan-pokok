# Dashboard Harga Bahan Pokok Indonesia — versi React

Proyek Vite + React 19 + TypeScript untuk dashboard
"Harga Bahan Pokok Indonesia" — harga eceran kebutuhan pokok nasional
dan per provinsi, dengan data live dari API baksosapi.com dan fallback
Mode arsip (snapshot 16–17 Nov 2026).

> **PENTING — JANGAN EDIT `index.html` DI ROOT SECARA LANGSUNG.**
> File `index.html` di root repo ini adalah **hasil build** dari
> `project/` (satu file HTML mandiri hasil `vite-plugin-singlefile`).
> Semua perubahan dilakukan di `project/src/`
> (`App.tsx`, komponen, `data/archive.ts`, atau `style.css`),
> lalu jalankan `npm run build` di `project/` dan salin
> `project/dist/index.html` ke root repo. Mengedit root `index.html`
> langsung akan tertimpa pada build berikutnya.

## Struktur

```
.
├── index.html            ← HASIL BUILD (yang disajikan Vercel, statis)
├── README.md             ← file ini
└── project/              ← proyek Vite + React + TypeScript (sumber)
    ├── package.json      ← react, react-dom, @vitejs/plugin-react;
    │                       script: dev / build / preview
    ├── tsconfig.json     ← strict mode + "jsx": "react-jsx"
    ├── vite.config.ts    ← react() + viteSingleFile(), outDir "dist"
    ├── index.html        ← shell sumber (head + <div id="root">)
    └── src/
        ├── main.tsx      ← entry: createRoot + <App /> (tanpa StrictMode)
        ├── App.tsx       ← state data live/arsip, fetch saat mount,
        │                   render semua section
        ├── types.ts      ← tipe respons API, peta komoditas, tuple
        │                   data provinsi, state live
        ├── components/
        │   ├── Masthead.tsx        ← topbar + judul + kotak Pembaruan
        │   │                         Terakhir + ticker (di dalam header)
        │   ├── Ticker.tsx          ← ticker harga berjalan
        │   ├── Indicators.tsx      ← strip indikator inflasi BPS
        │   ├── NationalTable.tsx   ← tabel nasional + pencarian &
        │   │                         filter kategori
        │   ├── BpsContext.tsx      ← konteks inflasi dari BPS (statis)
        │   ├── ProvinceSection.tsx ← detail provinsi + peringkat +
        │   │                         Pergerakan Terbesar + Termurah &
        │   │                         Termahal
        │   └── Sources.tsx         ← footer + daftar Sumber Data
        ├── data/
        │   └── archive.ts ← snapshot arsip 16–17 Nov 2026 (dipindah
        │                     persis dari main.ts vanilla — jangan ubah
        │                     angka/tanggal di sini)
        ├── lib/
        │   ├── api.ts       ← fetch baksosapi.com (timeout 8 detik,
        │   │                  gagal → null) + parsing respons
        │   ├── dates.ts     ← format tanggal (fmtLong/fmtShort/…)
        │   ├── format.ts    ← fmt, numOrNull, validDate, loadTimeWIB
        │   └── province.ts  ← buildActiveProv, computeMovers,
        │                      computeExtremes (logika murni)
        └── style.css       ← seluruh CSS (desain buletin navy-oranye,
                              TIDAK diubah dari versi vanilla)
```

## Cara build

```bash
cd project
npm install
npm run build        # tsc --noEmit && vite build
cp dist/index.html ../index.html
```

`npm run build` menjalankan `tsc --noEmit` dulu (type-check strict),
baru `vite build`. Hasilnya selalu **satu file HTML mandiri**
(`dist/index.html`, ~287 KB — lebih besar dari versi vanilla ~59 KB
karena React + ReactDOM ikut terbundel; gzip ~87 KB): JS dan CSS
ter-inline, favicon tetap data URI inline, hanya Google Fonts yang
masih dimuat eksternal. Vercel tetap menyajikan file ini secara
statis tanpa perubahan setting apa pun.

## Cara kerja situs

- **Tanpa backend, tanpa database.** Situs statis; Vercel menyajikan
  `index.html` apa adanya, tanpa perubahan setting apa pun.
- **Data live:** setiap halaman dibuka, `App` mengambil data dari
  `https://baksosapi.com/api/v1` (cermin pihak ketiga atas PIHPS
  Bank Indonesia & Panel Harga Pangan Bapanas): ringkasan nasional
  11 komoditas (`/summary?level=3`) + harga 4 komoditas per provinsi
  (`/prices/today?commodity=…&level=3`). Minyakita tidak tersedia
  di API itu, jadi tetap memakai snapshot 17 Nov 2026 berlabel tanggal.
- **Mode arsip:** state awal = data arsip; bila API tidak terjangkau
  (timeout 8 detik), halaman tetap menampilkan snapshot 16–17 Nov
  2026 yang tertanam di dalam file dan menandainya dengan lencana
  ARSIP + banner.
- **Cakupan:** Nasional · 38 Provinsi. Judul: "Harga Bahan Pokok
  Indonesia".

## Catatan konversi (vanilla → React)

- Perilaku dan tampilan dipertahankan identik: fetch, render, label
  tanggal, data snapshot arsip, dan fallback Mode arsip sama seperti
  versi vanilla. Markup hasil render memakai class dan struktur
  elemen yang sama, sehingga `style.css` yang tidak diubah tetap
  berlaku identik.
- **Tanpa StrictMode** (diputuskan sengaja di `main.tsx`): supaya
  tidak ada risiko perilaku ganda pada fetch saat mount.
- **Pergerakan Terbesar & Termurah/Termahal** memakai konten arsip
  STATIS yang sama persis dengan markup awal versi vanilla bila
  belum ada tanggal live, dan dihitung dari state aktif bila sudah
  live — karena konten statis itu (misalnya sel Minyakita "Bali" +
  catatan "Juga Banten, Gorontalo, Papua Tengah") memang ditulis
  tangan di HTML awal dan tidak sama dengan hasil hitung fungsi live.
- **Footer** (`Sources.tsx`) sama persis dengan footer vanilla
  (`<footer id="sumber">` + daftar sumber + caveat metodologi).

## Yang TIDAK ikut di-push

- `project/node_modules/` (~71 MB) — hasil `npm install`, instal
  ulang dengan `npm install`.
- `project/dist/` — hasil build; yang dipakai hanya salinannya di
  root repo (`index.html`).

## Riwayat versi

- **Satu file HTML** — versi awal (live di Vercel sejak 17 Nov 2026).
- **Vite + TypeScript** — konversi 18 Nov 2026: markup, CSS, data
  snapshot arsip, dan perilaku dipertahankan identik; hanya logika
  yang ditulis ulang dalam TypeScript strict.
- **Vite + TypeScript + React 19** — konversi 18 Nov 2026 (staging):
  logika dipindah ke komponen React dengan perilaku identik.
  Terverifikasi: `tsc` bersih (strict, tanpa `any`), `vite build`
  sukses, data arsip (ticker, tabel nasional 26 baris, peringkat
  38 provinsi × 5 komoditas, detail provinsi, Termurah/Termahal)
  identik secara nilai dengan versi vanilla, dan render mode live
  maupun Mode arsip teruji tanpa window error (badge LIVE/ARSIP,
  tabel nasional, dropdown 38 provinsi, peringkat 38 baris,
  interaksi chip kategori & dropdown provinsi).
