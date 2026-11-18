# Dashboard Harga Bahan Pokok Indonesia — versi TypeScript

Proyek Vite + TypeScript (vanilla, tanpa framework) untuk dashboard
"Harga Bahan Pokok Indonesia" — harga eceran kebutuhan pokok nasional
dan per provinsi, dengan data live dari API baksosapi.com dan fallback
Mode arsip (snapshot 16–17 Nov 2026).

> **PENTING — JANGAN EDIT `index.html` DI ROOT SECARA LANGSUNG.**
> File `index.html` di root repo ini adalah **hasil build** dari
> `project/` (satu file HTML mandiri hasil `vite-plugin-singlefile`).
> Semua perubahan dilakukan di `project/src/main.ts`,
> `project/src/style.css`, atau `project/index.html`, lalu jalankan
> `npm run build` di `project/` dan salin `project/dist/index.html`
> ke root repo. Mengedit root `index.html` langsung akan tertimpa
> pada build berikutnya.

## Struktur

```
.
├── index.html            ← HASIL BUILD (yang disajikan Vercel, statis)
├── README.md             ← file ini
└── project/              ← proyek Vite + TypeScript (sumber)
    ├── package.json      ← script: dev / build / preview
    ├── tsconfig.json     ← strict mode
    ├── vite.config.ts    ← viteSingleFile, outDir "dist"
    ├── index.html        ← shell sumber (markup sama persis dengan hasil build)
    └── src/
        ├── main.ts       ← seluruh logika (TypeScript strict, tanpa `any`)
        └── style.css     ← seluruh CSS (desain buletin navy-oranye)
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
(`dist/index.html`, ~59 KB): JS dan CSS ter-inline, favicon tetap
data URI inline, hanya Google Fonts yang masih dimuat eksternal.

## Cara kerja situs

- **Tanpa backend, tanpa database.** Situs statis; Vercel menyajikan
  `index.html` apa adanya, tanpa perubahan setting apa pun.
- **Data live:** setiap halaman dibuka, JavaScript di browser
  pengunjung mengambil data dari `https://baksosapi.com/api/v1`
  (cermin pihak ketiga atas PIHPS Bank Indonesia & Panel Harga
  Pangan Bapanas): ringkasan nasional 11 komoditas
  (`/summary?level=3`) + harga 4 komoditas per provinsi
  (`/prices/today?commodity=…&level=3`). Minyakita tidak tersedia
  di API itu, jadi tetap memakai snapshot 17 Nov 2026 berlabel tanggal.
- **Mode arsip:** bila API tidak terjangkau (timeout 8 detik),
  halaman menampilkan snapshot 16–17 Nov 2026 yang tertanam di
  dalam file dan menandainya dengan lencana ARSIP + banner.
- **Cakupan:** Nasional · 38 Provinsi. Judul: "Harga Bahan Pokok
  Indonesia".

## Yang TIDAK ikut di-push

- `project/node_modules/` — hasil `npm install`, instal ulang dengan
  `npm install`.
- `project/dist/` — hasil build; yang dipakai hanya salinannya di
  root repo (`index.html`).

## Riwayat versi

- **Satu file HTML** — versi awal (live di Vercel sejak 17 Nov 2026).
- **Vite + TypeScript** — konversi 18 Nov 2026: markup, CSS, data
  snapshot arsip, dan perilaku dipertahankan identik; hanya logika
  yang ditulis ulang dalam TypeScript strict (tipe untuk respons
  API, peta komoditas, tuple data provinsi 10 elemen, dan snapshot
  arsip). Build terverifikasi: `tsc` bersih, `vite build` sukses,
  data arsip (38 provinsi, 21 komoditas nasional, ticker) identik
  byte-per-byte secara nilai dengan versi satu-file, dan render
  mode live maupun Mode arsip teruji (badge LIVE/ARSIP, tabel
  nasional, dropdown 38 provinsi, peringkat 38 baris).
