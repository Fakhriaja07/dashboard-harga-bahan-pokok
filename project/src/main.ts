/**
 * Dashboard Harga Bahan Pokok Indonesia — logika halaman (TypeScript).
 *
 * Konversi dari blok <script> pada index.html satu-file (versi live
 * 18 Nov 2026). Perilaku dipertahankan identik: fetch live ke
 * baksosapi.com, render tabel/peringkat, dan fallback Mode arsip
 * dengan snapshot 16–17 Nov 2026 yang tertanam.
 *
 * Catatan konversi:
 * - IIFE pembungkus skrip asli dihapus: file ini adalah modul ES, jadi
 *   cakupan modul sudah memberi isolasi yang sama (tidak ada global).
 * - Deklarasi state lapisan live (MAIN_SLUGS, live, commLive,
 *   liveProvDate) dipindah ke atas, sebelum renderProv()/renderRank()
 *   pertama — pada skrip asli `var` membuat nilainya `undefined` saat
 *   render awal; di sini nilai awalnya null/false yang berperilaku sama
 *   (falsy) pada ekspresi yang memakainya.
 * - applyProvinsi(): bila payload live tidak membawa satu pun tanggal
 *   valid, label tanggal dibiarkan pada arsip (render data tetap jalan).
 *   Kasus ini tidak pernah terjadi pada data API yang sebenarnya.
 */

const API = "https://baksosapi.com/api/v1";

/* ================= Tipe ================= */

interface Tick {
  name: string;
  price: number;
  chg: number | null;
}

interface PriceItem {
  name: string;
  price: number;
  chg: number | null;
  pct: number | null;
}

interface CatGroup {
  id: string;
  label: string;
  items: PriceItem[];
}

interface Comm {
  name: string;
  unit: string;
}

/** Satu baris data provinsi: [beras17, beras16, cabai17, cabai16,
 *  bawang17, bawang16, telur17, telur16, minyakita17, minyakita16].
 *  null = provinsi belum melaporkan komoditas itu. */
type ProvRow = [
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];

interface SummaryRow {
  slug: string;
  name: string;
  avg: number;
  prev: number | null;
  changePct: number | null;
}

interface ProvPriceRow {
  price: number;
  prev: number | null;
  date: string | null;
}

interface LiveState {
  summary: { date: string | null; rows: SummaryRow[] } | null;
  bySlug: Record<string, SummaryRow> | null;
  prov: Record<string, Record<string, ProvPriceRow>>;
  any: boolean;
  maxProvDate: string | null;
}

interface CatDef {
  id: string;
  label: string;
}

interface NatMapEntry {
  cat: number;
  slug: string;
  name: string;
}

interface Mover {
  prov: string;
  comm: string;
  unit: string;
  v17: number;
  v16: number;
  pct: number;
}

/* ================= Helper ================= */

function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

const ESC_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC_MAP[c] ?? c);
}

/** Ambil elemen berdasarkan id; melempar bila tidak ada (markup halaman
 *  menjamin semua id yang dipakai di sini selalu ada). */
function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error("Elemen #" + id + " tidak ditemukan di halaman");
  return node as T;
}

/* ===== Ticker harga pilihan (PIHPS nasional, 17 Nov 2026) ===== */
let TICKS: Tick[] = [
    { name:"Beras super I",        price:17900, chg:-150 },
    { name:"Bawang merah",         price:38750, chg:1100 },
    { name:"Cabai merah keriting", price:84500, chg:-2700 },
    { name:"Cabai rawit merah",    price:96650, chg:null },
    { name:"Daging sapi kualitas I", price:152450, chg:-900 },
    { name:"Daging ayam ras",      price:38550, chg:250 },
    { name:"Telur ayam ras",       price:27850, chg:null },
    { name:"Minyak goreng curah",  price:20200, chg:-100 },
    { name:"Gula pasir lokal",     price:19600, chg:null }
  ];

function tickHTML(): string {
  let h = '<div class="tick-set">';
  TICKS.forEach((t) => {
    let c: string;
    if (t.chg === null) {
      c = '<span class="t-flat">Rp' + fmt(t.price) + '</span>';
    } else if (t.chg > 0) {
      c = '<span class="t-up">Rp' + fmt(t.price) + ' ▲' + fmt(t.chg) + '</span>';
    } else {
      c = '<span class="t-down">Rp' + fmt(t.price) + ' ▼' + fmt(Math.abs(t.chg)) + '</span>';
    }
    h += '<span class="tick"><span class="t-name">' + esc(t.name) + '</span>' + c + '</span>';
  });
  return h + '</div>';
}

const oneSet: string = tickHTML();
el("tickerTrack").innerHTML =
  oneSet + oneSet.replace('<div class="tick-set">', '<div class="tick-set" aria-hidden="true">');

/* ===== Data nasional PIHPS, 17 Nov 2026 =====
   chg: perubahan Rp vs hari sebelumnya (null = tidak dilaporkan)
   pct: persen perubahan seperti dilaporkan PIHPS (boleh null) */
let CATS: CatGroup[] = [
    { id:"beras", label:"Beras", items:[
      { name:"Beras kualitas bawah I",  price:15000, chg:-50,  pct:null },
      { name:"Beras kualitas bawah II", price:14800, chg:-50,  pct:null },
      { name:"Beras medium I",          price:16700, chg:-50,  pct:null },
      { name:"Beras medium II",         price:16500, chg:-50,  pct:null },
      { name:"Beras super I",           price:17900, chg:-150, pct:null },
      { name:"Beras super II",          price:17450, chg:-50,  pct:null }
    ]},
    { id:"bawang", label:"Bawang", items:[
      { name:"Bawang merah ukuran sedang", price:38750, chg:1100,  pct:2.92 },
      { name:"Bawang putih ukuran sedang", price:37850, chg:-600,  pct:-1.56 }
    ]},
    { id:"cabai", label:"Cabai", items:[
      { name:"Cabai merah besar",   price:66650, chg:-2650, pct:-3.82 },
      { name:"Cabai merah keriting",price:84500, chg:-2700, pct:-3.10 },
      { name:"Cabai rawit hijau",   price:75100, chg:-500,  pct:-0.66 },
      { name:"Cabai rawit merah",   price:96650, chg:null,  pct:null }
    ]},
    { id:"protein", label:"Protein", items:[
      { name:"Daging sapi kualitas I",  price:152450, chg:-900, pct:null },
      { name:"Daging sapi kualitas II", price:143350, chg:null, pct:null },
      { name:"Daging ayam ras segar",   price:38550,  chg:250,  pct:null },
      { name:"Telur ayam ras",          price:27850,  chg:null, pct:null }
    ]},
    { id:"minyak-gula", label:"Minyak Goreng & Gula", items:[
      { name:"Minyak goreng curah",              price:20200, chg:-100, pct:-0.49 },
      { name:"Minyak goreng kemasan bermerek I", price:24400, chg:-50,  pct:null },
      { name:"Minyak goreng kemasan bermerek II",price:23600, chg:-100, pct:null },
      { name:"Gula pasir premium",               price:20700, chg:-50,  pct:-0.24 },
      { name:"Gula pasir lokal",                 price:19600, chg:null, pct:null }
    ]}
  ];

const body = el("priceBody");
const emptyMsg = el("emptyMsg");
const searchInput = el<HTMLInputElement>("searchInput");
let activeCat = "semua";

function chgHTML(it: PriceItem): string {
  if (it.chg === null || it.chg === undefined) {
    return '<span class="chg flat" title="Tidak dilaporkan PIHPS">—</span>';
  }
  if (it.chg === 0) {
    return '<span class="chg flat">0 <span class="pct">(0,00%)</span></span>';
  }
  const up = it.chg > 0;
  const arrow = up ? "▲" : "▼";
  const sign = up ? "+" : "−";
  let txt = arrow + " " + sign + fmt(Math.abs(it.chg));
  if (it.pct !== null && it.pct !== undefined) {
    const p = it.pct.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    txt += ' <span class="pct">(' + (up ? "+" : "−") + p.replace("-", "") + '%)</span>';
  }
  return '<span class="chg ' + (up ? "up" : "down") + '">' + txt + '</span>';
}

function render(): void {
  const q = searchInput.value.trim().toLowerCase();
  let html = "";
  let any = false;
  CATS.forEach((cat) => {
    if (activeCat !== "semua" && activeCat !== cat.id) return;
    const rows = cat.items.filter((it) => !q || it.name.toLowerCase().indexOf(q) !== -1);
    if (rows.length === 0) return;
    any = true;
    html += '<tr class="cat-row"><td colspan="3">' + cat.label + '</td></tr>';
    rows.forEach((it) => {
      html +=
        '<tr><td><span class="item-name">' +
        it.name +
        '</span></td>' +
        '<td class="num price">' +
        fmt(it.price) +
        '</td>' +
        '<td class="num">' +
        chgHTML(it) +
        '</td></tr>';
    });
  });
  body.innerHTML = html;
  emptyMsg.hidden = any;
}

searchInput.addEventListener("input", render);
el("catChips").addEventListener("click", function (e) {
  const btn = (e.target as HTMLElement | null)?.closest(".chip");
  if (!btn) return;
  activeCat = btn.getAttribute("data-cat") ?? "semua";
  const chips = this.querySelectorAll(".chip");
  for (let i = 0; i < chips.length; i++) {
    chips[i].setAttribute("aria-pressed", chips[i] === btn ? "true" : "false");
  }
  render();
});
render();

/* ===== Harga per Provinsi (Bapanas, 17 Nov vs 16 Nov 2026) =====
   Urutan array per provinsi: [beras17, beras16, cabai17, cabai16,
   bawang17, bawang16, telur17, telur16, minyakita17, minyakita16]
   null = belum dilaporkan provinsi pada kedua tanggal. */
const COMMS: Comm[] = [
  { name: "Beras Medium", unit: "/kg" },
  { name: "Cabai Rawit Merah", unit: "/kg" },
  { name: "Bawang Merah", unit: "/kg" },
  { name: "Telur Ayam", unit: "/kg" },
  { name: "Minyakita", unit: "/liter" },
];
const NAS17: number[] = [13728, 86209, 35774, 27861, 16895];
let PROV: Record<string, ProvRow> = {
    "Aceh":[14253,14333,66250,66875,33209,33368,25772,26010,16445,16356],
    "Bali":[13670,13663,63409,63334,26955,26857,26970,26970,15700,15718],
    "Banten":[13191,13042,73000,74000,35550,34810,24905,24250,15700,15700],
    "Bengkulu":[13806,13797,80607,80000,34606,33944,27468,27483,16588,16525],
    "DI Yogyakarta":[13487,13490,66130,65043,33862,33621,24120,23980,16927,16927],
    "DKI Jakarta":[13331,13379,78667,78067,40267,39867,25441,25531,17600,17600],
    "Gorontalo":[14693,14711,133824,130000,39000,39667,31998,31955,15700,15700],
    "Jambi":[12631,12631,78522,79273,28405,28722,27042,27041,15885,15885],
    "Jawa Barat":[13096,13080,70581,70297,33727,32506,24682,24641,15835,15851],
    "Jawa Tengah":[13327,13339,66082,65343,31517,31534,24073,23964,16023,16017],
    "Jawa Timur":[12928,12897,62571,61758,29674,29424,23132,23071,16097,15989],
    "Kalimantan Barat":[14493,14546,104915,106878,43000,43000,30863,30885,17958,18048],
    "Kalimantan Selatan":[14196,14125,111667,106250,32316,31750,27365,27360,17120,17151],
    "Kalimantan Tengah":[14189,14241,106341,107250,37796,37809,29804,29845,17304,17361],
    "Kalimantan Timur":[14839,14932,84606,89161,38784,38670,30747,31296,16213,16467],
    "Kalimantan Utara":[14176,14176,98043,100714,43522,43304,31677,31867,17906,17413],
    "Kepulauan Bangka Belitung":[13770,13790,92909,94909,37485,37303,29983,29950,16467,16574],
    "Kepulauan Riau":[12975,12943,92714,92318,41560,41577,29371,29313,16345,16345],
    "Lampung":[13569,13717,69045,69080,30000,29862,25767,25794,16722,16620],
    "Maluku":[14895,15107,131290,136176,42282,42738,33535,34321,18164,18539],
    "Maluku Utara":[15427,15204,148095,142083,50385,50893,32874,32572,20655,20308],
    "Nusa Tenggara Barat":[12832,12933,53508,53387,27273,27250,27870,28246,16133,15996],
    "Nusa Tenggara Timur":[13922,13924,58000,56786,26860,26476,30417,29907,17779,17810],
    "Papua":[15335,15210,106190,106429,54261,54261,35840,35840,19609,19609],
    "Papua Barat":[15857,16000,131923,127500,60000,62500,37536,37469,19570,19570],
    "Papua Barat Daya":[15078,15513,104545,116250,51944,52143,37289,38115,18814,18675],
    "Papua Pegunungan":[20000,20000,140000,140000,null,null,50000,50000,null,null],
    "Papua Selatan":[15688,13875,154000,147500,60000,55000,51429,51250,23425,15700],
    "Papua Tengah":[15173,15654,null,null,50000,50000,37611,37150,15700,15700],
    "Riau":[13496,13513,81573,81494,34134,34026,26449,26585,15956,16096],
    "Sulawesi Barat":[13331,13208,101050,105316,37435,37174,25429,25054,15994,16295],
    "Sulawesi Selatan":[12781,12790,77013,78320,33350,33455,25039,25154,16330,16279],
    "Sulawesi Tengah":[13832,13782,115833,115676,41205,41370,26979,27124,16257,16228],
    "Sulawesi Tenggara":[13522,13534,92500,93000,38148,38265,26986,27114,18064,18195],
    "Sulawesi Utara":[13620,13700,127042,130021,41149,41021,31576,31517,17426,17444],
    "Sumatera Barat":[13108,13100,76065,75655,33763,33125,28816,28610,18094,18073],
    "Sumatera Selatan":[13246,13255,71610,70814,33016,32867,25962,25730,16413,16296],
    "Sumatera Utara":[14035,14056,68842,71818,31595,31527,27423,27709,17338,17181]
  };

/* State lapisan live — dideklarasikan di sini, sebelum renderProv() dan
   renderRank() pertama, karena kedua render itu sudah membaca
   liveProvDate/commLive (lihat catatan di kepala file). */
const MAIN_SLUGS: string[] = ["beras-medium", "cabai-rawit", "bawang-merah", "telur-ayam"];
const ALL_PROV_SLUGS: string[] = MAIN_SLUGS.slice();
const live: LiveState = { summary: null, bySlug: null, prov: {}, any: false, maxProvDate: null };
const commLive: boolean[] = [false, false, false, false, false]; /* Minyakita tidak pernah live */
let liveProvDate: string | null = null; /* tanggal terbaru dari payload provinsi (bisa beda dari ringkasan nasional) */

function provChgHTML(v17: number | null, v16: number | null): string {
  if (v17 === null || v16 === null) {
    return '<span class="chg flat" title="Belum dilaporkan provinsi">—</span>';
  }
  const d = v17 - v16;
  if (d === 0) {
    return '<span class="chg flat">0 <span class="pct">(0,00%)</span></span>';
  }
  const up = d > 0;
  const p = (((v17 - v16) / v16) * 100)
    .toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace("-", "");
  const txt =
    (up ? "▲ +" : "▼ −") +
    fmt(Math.abs(d)) +
    ' <span class="pct">(' +
    (up ? "+" : "−") +
    p +
    '%)</span>';
  return '<span class="chg ' + (up ? "up" : "down") + '">' + txt + '</span>';
}

function vsHTML(v17: number | null, nas: number): string {
  if (v17 === null) return '<span class="vs na">—</span>';
  const d = v17 - nas;
  if (d === 0) return '<span class="vs same">Sama dengan nasional</span>';
  if (d < 0) return '<span class="vs cheap">−' + fmt(-d) + ' lebih murah</span>';
  return '<span class="vs exp">+' + fmt(d) + ' lebih mahal</span>';
}

/* Pemilih provinsi + kartu detail */
const provSel = el<HTMLSelectElement>("provSelect");
let provNames: string[] = Object.keys(PROV).sort((a, b) => a.localeCompare(b, "id"));
provNames.forEach((name) => {
  const o = document.createElement("option");
  o.value = name;
  o.textContent = name;
  if (name === "Aceh") o.selected = true;
  provSel.appendChild(o);
});

function renderProv(): void {
  const name = provSel.value;
  const a = PROV[name];
  el("provName").textContent = name;
  let html = "";
  COMMS.forEach((c, i) => {
    const v17 = a[i * 2];
    const v16 = a[i * 2 + 1];
    /* Di mode live, komoditas yang tidak live (selalu Minyakita, atau yang
       datanya gagal diambil) tetap memakai arsip 17 Nov vs 16 Nov — beri
       tag tanggal pada barisnya agar tidak terbaca sebagai perubahan
       terhadap hari sebelum tanggal live pada header kolom. */
    const tag =
      liveProvDate && commLive && !commLive[i]
        ? '<span class="row-tag">data 17 Nov · vs 16 Nov</span>'
        : "";
    html +=
      '<tr><td><span class="item-name">' +
      c.name +
      '</span> <span class="item-unit">' +
      c.unit +
      '</span>' +
      tag +
      '</td>' +
      '<td class="num price">' +
      (v17 === null ? "—" : fmt(v17)) +
      '</td>' +
      '<td class="num">' +
      provChgHTML(v17, v16) +
      '</td>' +
      '<td class="num hide-sm">' +
      vsHTML(v17, NAS17[i]) +
      '</td></tr>';
  });
  el("provBody").innerHTML = html;
}

provSel.addEventListener("change", renderProv);
renderProv();

/* Tabel peringkat antarprovinsi */
let rankCi = 1;

function renderRank(): void {
  const rows = provNames.map((name) => {
    const a = PROV[name];
    return { name, v17: a[rankCi * 2], v16: a[rankCi * 2 + 1] };
  });
  rows.sort((x, y) => {
    if (x.v17 === null) return 1;
    if (y.v17 === null) return -1;
    return y.v17 - x.v17;
  });
  let html = "";
  rows.forEach((r, i) => {
    html +=
      '<tr><td class="rank-num">' +
      (i + 1) +
      '</td>' +
      '<td><span class="item-name">' +
      esc(r.name) +
      '</span></td>' +
      '<td class="num price">' +
      (r.v17 === null ? "—" : fmt(r.v17)) +
      '</td>' +
      '<td class="num">' +
      provChgHTML(r.v17, r.v16) +
      '</td></tr>';
  });
  el("rankBody").innerHTML = html;
  el("rankPriceHead").textContent = "Harga (Rp" + COMMS[rankCi].unit + ")";
  if (liveProvDate) {
    /* Minyakita selalu data arsip 17 Nov 2026, jadi perubahannya terhadap
       16 Nov — bukan terhadap hari sebelum tanggal live. */
    const chgBase = rankCi === 4 ? "2026-11-17" : liveProvDate;
    el("rankChgHead").textContent = "Perubahan vs " + fmtDayMon(prevISO(chgBase));
  }
}

el("rankChips").addEventListener("click", function (e) {
  const btn = (e.target as HTMLElement | null)?.closest(".chip");
  if (!btn) return;
  rankCi = parseInt(btn.getAttribute("data-ci") ?? "", 10);
  const chips = this.querySelectorAll(".chip");
  for (let i = 0; i < chips.length; i++) {
    chips[i].setAttribute("aria-pressed", chips[i] === btn ? "true" : "false");
  }
  renderRank();
});
renderRank();

/* ============================================================
   LAPISAN DATA LIVE — baksosapi.com
   Cermin pihak ketiga atas PIHPS Bank Indonesia & Panel Harga
   Pangan Bapanas. Semua data statis di atas tetap dipertahankan
   sebagai cadangan: fetch yang gagal membuat bagiannya memakai
   snapshot 16–17 Nov 2026 dengan labelnya sendiri.
   ============================================================ */
const BULAN_P: string[] = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const BULAN_S: string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const HARI: string[] = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface DateParts {
  y: number;
  m: number;
  d: number;
}

function dObj(iso: string): DateParts {
  const p: string[] = String(iso).split("-");
  return { y: +p[0], m: +p[1], d: +p[2] };
}

function fmtLong(iso: string): string {
  const t = dObj(iso);
  const wd = new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay();
  return HARI[wd] + ", " + t.d + " " + BULAN_S[t.m - 1] + " " + t.y;
}

function fmtShort(iso: string): string {
  const t = dObj(iso);
  return t.d + " " + BULAN_S[t.m - 1] + " " + t.y;
}

function fmtDM(iso: string): string {
  const t = dObj(iso);
  return t.d + " " + BULAN_P[t.m - 1];
}

function fmtDayMon(iso: string): string {
  const t = dObj(iso);
  return t.d + " " + BULAN_S[t.m - 1];
}

function prevISO(iso: string): string {
  const t = dObj(iso);
  const dt = new Date(Date.UTC(t.y, t.m - 1, t.d) - 864e5);
  const z = (n: number): string => (n < 10 ? "0" : "") + n;
  return dt.getUTCFullYear() + "-" + z(dt.getUTCMonth() + 1) + "-" + z(dt.getUTCDate());
}

function rangeLabel(iso: string): string {
  const pv = prevISO(iso);
  const a = dObj(pv);
  const b = dObj(iso);
  if (a.m === b.m && a.y === b.y) return a.d + " → " + b.d + " " + BULAN_S[b.m - 1] + " " + b.y;
  return fmtShort(pv) + " → " + fmtShort(iso);
}

async function fetchJSON(url: string): Promise<unknown> {
  const ctl: AbortController | null = "AbortController" in window ? new AbortController() : null;
  const timer: number = window.setTimeout(() => {
    if (ctl) ctl.abort();
  }, 8000);
  try {
    const r: Response = await fetch(url, ctl ? { signal: ctl.signal } : {});
    if (!r.ok) throw new Error("http " + r.status);
    const j: unknown = await r.json();
    return j;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/* Sanitasi data API (sumber pihak ketiga): angka harus benar-benar
   numerik dan tanggal harus berformat ISO, selain itu dibuang. */
function numOrNull(v: unknown): number | null {
  const n: number = Number(v);
  return isFinite(n) ? n : null;
}

function validDate(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Narrowing untuk JSON mentah: objek biasa (bukan array, bukan null). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/* Jam halaman dimuat (WIB) pada kotak Pembaruan Terakhir */
try {
  const t = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  el("ubTime").textContent = t + " WIB";
} catch {
  /* biarkan nilai snapshot */
}

/* ----- Ringkasan nasional → ticker + tabel nasional ----- */
const CAT_DEFS: CatDef[] = [
  { id: "beras", label: "Beras" },
  { id: "bawang", label: "Bawang" },
  { id: "cabai", label: "Cabai" },
  { id: "protein", label: "Protein" },
  { id: "minyak-gula", label: "Minyak Goreng & Gula" },
];
const NAT_MAP: NatMapEntry[] = [
  { cat: 0, slug: "beras-premium", name: "Beras Premium" },
  { cat: 0, slug: "beras-medium", name: "Beras Medium" },
  { cat: 1, slug: "bawang-merah", name: "Bawang Merah" },
  { cat: 1, slug: "bawang-putih", name: "Bawang Putih" },
  { cat: 2, slug: "cabai-merah", name: "Cabai Merah" },
  { cat: 2, slug: "cabai-rawit", name: "Cabai Rawit Merah" },
  { cat: 3, slug: "daging-sapi", name: "Daging Sapi" },
  { cat: 3, slug: "daging-ayam", name: "Daging Ayam Ras" },
  { cat: 3, slug: "telur-ayam", name: "Telur Ayam Ras" },
  { cat: 4, slug: "minyak-goreng", name: "Minyak Goreng" },
  { cat: 4, slug: "gula-pasir", name: "Gula Pasir" },
];

function applySummary(rows: SummaryRow[], date: string | null): void {
  const bySlug: Record<string, SummaryRow> = {};
  rows.forEach((r) => {
    bySlug[r.slug] = r;
  });
  live.bySlug = bySlug;
  /* Ticker dari ringkasan live */
  TICKS = rows.map((r) => ({
    name: r.name,
    price: r.avg,
    chg: typeof r.prev === "number" ? r.avg - r.prev : null,
  }));
  const one = tickHTML();
  el("tickerTrack").innerHTML =
    one + one.replace('<div class="tick-set">', '<div class="tick-set" aria-hidden="true">');
  /* Tabel nasional: 11 komoditas live dalam 5 kategori yang sama */
  const cats: CatGroup[] = CAT_DEFS.map((c) => ({ id: c.id, label: c.label, items: [] }));
  NAT_MAP.forEach((m) => {
    const r = bySlug[m.slug];
    if (!r) return;
    cats[m.cat].items.push({
      name: m.name,
      price: r.avg,
      chg: typeof r.prev === "number" ? r.avg - r.prev : null,
      pct: typeof r.changePct === "number" ? r.changePct * 100 : null,
    });
  });
  CATS = cats;
  render();
  if (!date) return;
  el("natMeta").innerHTML =
    "SUMBER: <b>PIHPS &amp; BAPANAS VIA BAKSOSAPI.COM</b><br />DATA " +
    fmtShort(date).toUpperCase() +
    " · LIVE";
  el("natTable").setAttribute(
    "aria-label",
    "Harga bahan pokok nasional PIHPS & Bapanas via baksosapi.com, data live " +
      fmtDM(date) +
      " " +
      dObj(date).y,
  );
  el("natLede").textContent =
    "Harga eceran nasional per kilogram di pasar tradisional — 11 komoditas yang diambil live dari API baksosapi.com (cermin data PIHPS Bank Indonesia & Panel Harga Pangan Bapanas) setiap halaman ini dibuka. Kolom perubahan adalah selisih terhadap hari sebelumnya (" +
    fmtShort(prevISO(date)) +
    "). Komoditas “Cabai Merah” memakai nama sesuai API — API tidak merinci variannya, jadi jangan disamakan dengan “cabai merah besar” PIHPS pada data arsip.";
  el("natNote").textContent =
    "Tanda “—” pada kolom perubahan berarti API tidak melaporkan harga kemarin untuk komoditas tersebut.";
}

/* ----- Harga per Provinsi ----- */
function buildActiveProv(): Record<string, ProvRow> {
  const active: Record<string, ProvRow> = {};
  Object.keys(PROV).forEach((name) => {
    active[name] = PROV[name].slice() as ProvRow;
  });
  MAIN_SLUGS.forEach((slug, i) => {
    const map = live.prov[slug];
    if (!map) return;
    commLive[i] = true;
    Object.keys(active).forEach((name) => {
      const row = map[name];
      active[name][i * 2] = row ? row.price : null;
      active[name][i * 2 + 1] = row ? row.prev : null;
    });
    Object.keys(map).forEach((name) => {
      if (!active[name]) {
        const arr: ProvRow = [null, null, null, null, null, null, null, null, null, null];
        arr[i * 2] = map[name].price;
        arr[i * 2 + 1] = map[name].prev;
        active[name] = arr;
      }
    });
  });
  return active;
}

function rebuildProvSelect(): void {
  const cur = provSel.value;
  provNames = Object.keys(PROV).sort((a, b) => a.localeCompare(b, "id"));
  provSel.innerHTML = "";
  provNames.forEach((name) => {
    const o = document.createElement("option");
    o.value = name;
    o.textContent = name;
    provSel.appendChild(o);
  });
  provSel.value = PROV[cur] ? cur : "Aceh";
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return names[0] + " & " + names[1];
  return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
}

function renderExtremesLive(date: string): void {
  let html = "";
  COMMS.forEach((c, i) => {
    let min: number | null = null;
    let max: number | null = null;
    let minN: string[] = [];
    let maxN: string[] = [];
    provNames.forEach((name) => {
      const v = PROV[name][i * 2];
      if (v === null) return;
      if (min === null || v < min) {
        min = v;
        minN = [name];
      } else if (v === min) minN.push(name);
      if (max === null || v > max) {
        max = v;
        maxN = [name];
      } else if (v === max) maxN.push(name);
    });
    if (min === null || max === null) return;
    html +=
      '<tr><td><span class="item-name">' +
      c.name +
      '</span> <span class="item-unit">' +
      c.unit +
      '</span>' +
      (i === 4 ? '<span class="ext-note">Data 17 Nov 2026</span>' : "") +
      '</td>' +
      '<td><span class="ext-prov">' +
      esc(joinNames(minN)) +
      '</span><span class="ext-price">Rp' +
      fmt(min) +
      '</span></td>' +
      '<td><span class="ext-prov">' +
      esc(joinNames(maxN)) +
      '</span><span class="ext-price">Rp' +
      fmt(max) +
      '</span></td></tr>';
  });
  el("extBody").innerHTML = html;
  el("extNote").textContent =
    "Harga rata-rata eceran " + fmtShort(date) + " dari data live · Minyakita: data 17 Nov 2026.";
  el("extTable").setAttribute(
    "aria-label",
    "Provinsi termurah dan termahal per komoditas dari data live " +
      fmtDM(date) +
      " " +
      dObj(date).y +
      "; Minyakita data 17 November 2026",
  );
}

function renderMoversLive(date: string): void {
  const ups: Mover[] = [];
  const downs: Mover[] = [];
  COMMS.forEach((c, i) => {
    if (!commLive[i]) return;
    provNames.forEach((name) => {
      const a = PROV[name];
      const v17 = a[i * 2];
      const v16 = a[i * 2 + 1];
      if (v17 === null || v16 === null || v16 === 0 || v17 === v16) return;
      const e: Mover = {
        prov: name,
        comm: c.name,
        unit: c.unit,
        v17,
        v16,
        pct: ((v17 - v16) / v16) * 100,
      };
      if (v17 > v16) ups.push(e);
      else downs.push(e);
    });
  });
  ups.sort((a, b) => b.pct - a.pct);
  downs.sort((a, b) => a.pct - b.pct);
  const rowHTML = (e: Mover): string =>
    '<div class="mv-row"><div class="mv-name">' +
    esc(e.prov) +
    '<span>' +
    esc(e.comm) +
    ' · ' +
    e.unit +
    '</span></div>' +
    provChgHTML(e.v17, e.v16) +
    '</div>';
  el("mvUpRows").innerHTML =
    ups.slice(0, 5).map(rowHTML).join("") ||
    '<div class="mv-row"><div class="mv-name">Tidak ada kenaikan pada komoditas live</div></div>';
  el("mvDownRows").innerHTML =
    downs.slice(0, 5).map(rowHTML).join("") ||
    '<div class="mv-row"><div class="mv-name">Tidak ada penurunan pada komoditas live</div></div>';
  el("mvHead").textContent = "Pergerakan Terbesar, " + rangeLabel(date);
  const topDowns = downs.slice(0, 5);
  const allSame = topDowns.length > 0 && topDowns.every((e) => e.comm === topDowns[0].comm);
  el("mvDownSub").textContent = allSame
    ? "Semuanya " + topDowns[0].comm.toLowerCase()
    : "Berdasarkan persen perubahan";
  const extreme = ups.filter((e) => e.pct > 10);
  if (extreme.length > 0) {
    const e0 = extreme[0];
    el("mvUpNote").innerHTML =
      "<b>Catatan:</b> ada kenaikan di atas 10% dalam sehari — terbesar " +
      esc(e0.comm.toLowerCase()) +
      " di " +
      esc(e0.prov) +
      " (+" +
      e0.pct.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      "%) — lonjakan sebesar itu kemungkinan karena pelaporan di provinsi tersebut masih terbatas, tetapi angka inilah yang dilaporkan sumber data.";
  } else {
    el("mvUpNote").textContent =
      "Dihitung dari data live " +
      fmtShort(date) +
      " terhadap hari sebelumnya, untuk komoditas yang tersedia di API. Minyakita tidak termasuk karena masih data 17 Nov 2026.";
  }
  el("mvDownNote").textContent =
    "Dihitung dari data live " +
    fmtShort(date) +
    " terhadap hari sebelumnya untuk komoditas live; Minyakita tidak termasuk karena belum tersedia di API (tetap data 17 Nov 2026).";
}

function applyProvinsi(date: string | null): void {
  PROV = buildActiveProv();
  const bySlug = live.bySlug;
  if (bySlug) {
    MAIN_SLUGS.forEach((slug, i) => {
      const r = bySlug[slug];
      if (r) NAS17[i] = r.avg;
    });
  }
  /* Tanggal section ini mengikuti payload provinsi itu sendiri: baris
     provinsi bisa tertinggal sehari dari ringkasan nasional, jadi
     tanggalnya ditampilkan apa adanya, bukan tanggal nasional. */
  const provDate: string | null = live.maxProvDate || date;
  liveProvDate = provDate;
  rebuildProvSelect();
  renderProv();
  renderRank();
  if (provDate === null) return; /* tanpa tanggal valid: biarkan label arsip */
  renderMoversLive(provDate);
  renderExtremesLive(provDate);
  el("provMeta").innerHTML =
    "SUMBER: <b>BAPANAS &amp; PIHPS VIA BAKSOSAPI.COM</b><br />DATA " +
    fmtShort(provDate).toUpperCase() +
    " · VS HARI SEBELUMNYA";
  el("provHeadNote").textContent =
    "DATA LIVE " + fmtShort(provDate).toUpperCase() + " · PERUBAHAN VS HARI SEBELUMNYA";
  el("provChgHead").textContent = "Perubahan vs " + fmtDayMon(prevISO(provDate));
  el("rankTable").setAttribute(
    "aria-label",
    "Peringkat harga komoditas per provinsi dari data live " +
      fmtDM(provDate) +
      " " +
      dObj(provDate).y,
  );
  el("provLede").innerHTML =
    "Harga rata-rata eceran tingkat konsumen untuk <strong>38 provinsi</strong> dan 5 komoditas utama. Beras medium, cabai rawit merah, bawang merah, dan telur ayam diambil <strong>live dari API baksosapi.com</strong> — cermin Panel Harga Pangan Bapanas dan PIHPS — setiap halaman dibuka; <strong>Minyakita tetap data 17 November 2026</strong> karena tidak tersedia di API itu. Pilih provinsi untuk melihat detail harganya, atau pakai peringkat di bawah untuk membandingkan satu komoditas antarprovinsi. Perubahan adalah selisih harga terbaru terhadap harga hari sebelumnya yang dilaporkan API untuk provinsi itu. Perhatian: angka live per provinsi mengikuti seri API baksosapi.com (skala PIHPS), bukan seri arsip Bapanas di halaman ini — selisih besar antara mode live dan mode arsip, misalnya pada beras medium, adalah pergantian seri sumber, bukan kenaikan harga dalam sehari.";
  const avgParts = COMMS.map((c, i) => c.name.toLowerCase() + " Rp" + fmt(NAS17[i]) + c.unit);
  const note =
    (live.bySlug
      ? "Rata-rata nasional " + fmtShort(date ?? provDate)
      : "Rata-rata nasional arsip 17 Nov 2026") +
    ": " +
    avgParts.join(" · ") +
    (live.bySlug ? ". Minyakita: data 17 Nov 2026, perubahannya terhadap 16 Nov 2026." : ".");
  const missing: string[] = [];
  COMMS.forEach((c, i) => {
    provNames.forEach((name) => {
      if (PROV[name][i * 2] === null) missing.push(name + " (" + c.name.toLowerCase() + ")");
    });
  });
  let fullNote = note + " Tanda “—” berarti provinsi belum melaporkan komoditas itu";
  fullNote += missing.length > 0 ? ": " + missing.join(", ") + "." : ".";
  const fellBack: string[] = [];
  MAIN_SLUGS.forEach((slug, i) => {
    if (!commLive[i]) fellBack.push(COMMS[i].name.toLowerCase());
  });
  if (fellBack.length > 0)
    fullNote +=
      " Data live " +
      fellBack.join(", ") +
      " tidak terjangkau saat halaman dimuat — komoditas itu memakai data arsip 17 Nov 2026.";
  el("provNote").textContent = fullNote;
  el("rankUnit").textContent =
    "Pilih komoditas — tabel mengurutkan provinsi dari harga tertinggi ke terendah pada " +
    fmtShort(provDate) +
    ", lengkap dengan perubahannya terhadap hari sebelumnya. Provinsi yang belum melaporkan komoditas itu tampil di bagian bawah dengan tanda “—”. Minyakita memakai data 17 Nov 2026.";
}

/* ----- Status masthead ----- */
function finalize(date: string | null): void {
  const badge = el("liveBadge");
  if (live.any) {
    badge.className = "live-badge is-live";
    badge.innerHTML = '<span class="dot"></span>LIVE';
    el("ubSource").textContent = "baksosapi.com · PIHPS & Bapanas";
    if (date) {
      el("ubDate").textContent = fmtLong(date);
      el("topStatus").innerHTML =
        "Data live · <b>" + fmtDM(date) + " " + dObj(date).y + "</b>";
      el("footStatus").textContent =
        "Data live: " + fmtShort(date) + " · arsip cadangan 16–17 Nov 2026";
    }
    if (!live.summary) {
      el("natMeta").innerHTML =
        "SUMBER: <b>PIHPS NASIONAL (BANK INDONESIA)</b><br />UPDATE 17 NOV 2026 · MODE ARSIP";
    }
  } else {
    badge.className = "live-badge is-arsip";
    badge.innerHTML = '<span class="dot"></span>ARSIP';
    el("archiveBanner").hidden = false;
    el("topStatus").innerHTML = "Mode arsip · <b>data 17 November 2026</b>";
  }
}

/* ----- Ambil data live ----- */
const summaryP: Promise<void> = fetchJSON(API + "/summary?level=3").then((j) => {
  if (!isRecord(j)) return;
  const data: unknown = j.data;
  if (!isRecord(data)) return;
  const rowsRaw: unknown = data.rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return;
  const rows: SummaryRow[] = [];
  rowsRaw.forEach((r) => {
    if (!isRecord(r)) return;
    const avg = numOrNull(r.avg);
    if (avg === null || typeof r.slug !== "string") return;
    rows.push({
      slug: r.slug,
      name: String(r.name || r.slug),
      avg,
      prev: numOrNull(r.prev),
      changePct: numOrNull(r.changePct),
    });
  });
  if (rows.length > 0) {
    live.summary = { date: validDate(data.date), rows };
    live.any = true;
  }
});

const provPs: Promise<void>[] = ALL_PROV_SLUGS.map((slug) =>
  fetchJSON(API + "/prices/today?commodity=" + slug + "&level=3").then((j) => {
    if (!isRecord(j)) return;
    const data: unknown = j.data;
    if (!Array.isArray(data) || data.length === 0) return;
    const map: Record<string, ProvPriceRow> = {};
    data.forEach((r) => {
      if (!isRecord(r)) return;
      const price = numOrNull(r.price);
      if (price === null || typeof r.regionName !== "string") return;
      map[r.regionName] = {
        price,
        prev: numOrNull(r.prevPrice),
        date: validDate(r.date),
      };
    });
    if (Object.keys(map).length > 0) {
      live.prov[slug] = map;
      live.any = true;
    }
  }),
);

Promise.all([summaryP, ...provPs]).then(() => {
  let maxD: string | null = null;
  ALL_PROV_SLUGS.forEach((slug) => {
    const map = live.prov[slug];
    if (!map) return;
    Object.keys(map).forEach((k) => {
      const d = map[k].date;
      if (d && (!maxD || d > maxD)) maxD = d;
    });
  });
  live.maxProvDate = maxD;
  const dataDate: string | null =
    live.summary && live.summary.date ? live.summary.date : maxD;
  if (live.summary) applySummary(live.summary.rows, dataDate);
  if (MAIN_SLUGS.some((s) => !!live.prov[s])) applyProvinsi(dataDate);
  finalize(dataDate);
});
