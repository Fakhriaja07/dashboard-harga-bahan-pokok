// Tipe data dashboard (dipindah dari main.ts vanilla, tanpa perubahan makna).

export interface Tick {
  name: string;
  price: number;
  chg: number | null;
}

export interface PriceItem {
  name: string;
  price: number;
  chg: number | null;
  pct: number | null;
  /** Slug API (hanya untuk item live; item arsip tidak punya slug). */
  slug?: string;
}

/** Satu titik riwayat harga dari endpoint /history. */
export interface HistoryPoint {
  date: string;
  price: number;
}

export interface CatGroup {
  id: string;
  label: string;
  items: PriceItem[];
}

export interface Comm {
  name: string;
  unit: string;
}

/** Satu baris data provinsi: [beras17, beras16, cabai17, cabai16,
 *  bawang17, bawang16, telur17, telur16, minyakita17, minyakita16].
 *  null = provinsi belum melaporkan komoditas itu. */
export type ProvRow = [
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

export type ProvMap = Record<string, ProvRow>;

export interface SummaryRow {
  slug: string;
  name: string;
  avg: number;
  prev: number | null;
  changePct: number | null;
}

export interface ProvPriceRow {
  price: number;
  prev: number | null;
  date: string | null;
}

export interface LiveState {
  summary: { date: string | null; rows: SummaryRow[] } | null;
  bySlug: Record<string, SummaryRow> | null;
  prov: Record<string, Record<string, ProvPriceRow>>;
  any: boolean;
  maxProvDate: string | null;
}

export interface CatDef {
  id: string;
  label: string;
}

export interface NatMapEntry {
  cat: number;
  slug: string;
  name: string;
}

export interface Mover {
  prov: string;
  comm: string;
  unit: string;
  v17: number;
  v16: number;
  pct: number;
}

export interface DateParts {
  y: number;
  m: number;
  d: number;
}
