// Data snapshot arsip 16–17 Nov 2026 (PIHPS nasional + Panel Harga Bapanas).
// Dipindah PERSIS dari main.ts vanilla (bukan diketik ulang) — jangan ubah
// angka/tanggal di sini; file ini adalah cadangan Mode arsip halaman.
import type {
  CatDef,
  CatGroup,
  Comm,
  NatMapEntry,
  ProvRow,
  Tick,
} from "../types";

export const ARCHIVE_TICKS: Tick[] = [
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

export const ARCHIVE_CATS: CatGroup[] = [
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

export const COMMS: Comm[] = [
  { name: "Beras Medium", unit: "/kg" },
  { name: "Cabai Rawit Merah", unit: "/kg" },
  { name: "Bawang Merah", unit: "/kg" },
  { name: "Telur Ayam", unit: "/kg" },
  { name: "Minyakita", unit: "/liter" },
];

export const ARCHIVE_NAS17: number[] = [13728, 86209, 35774, 27861, 16895];

export const ARCHIVE_PROV: Record<string, ProvRow> = {
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

export const CAT_DEFS: CatDef[] = [
  { id: "beras", label: "Beras" },
  { id: "bawang", label: "Bawang" },
  { id: "cabai", label: "Cabai" },
  { id: "protein", label: "Protein" },
  { id: "minyak-gula", label: "Minyak Goreng & Gula" },
];

export const NAT_MAP: NatMapEntry[] = [
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
