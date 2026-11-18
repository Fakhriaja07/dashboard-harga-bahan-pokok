// Helper tanggal (dipindah dari main.ts vanilla, tanpa perubahan).
import type { DateParts } from "../types";

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

export function dObj(iso: string): DateParts {
  const p: string[] = String(iso).split("-");
  return { y: +p[0], m: +p[1], d: +p[2] };
}

export function fmtLong(iso: string): string {
  const t = dObj(iso);
  const wd = new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay();
  return HARI[wd] + ", " + t.d + " " + BULAN_S[t.m - 1] + " " + t.y;
}

export function fmtShort(iso: string): string {
  const t = dObj(iso);
  return t.d + " " + BULAN_S[t.m - 1] + " " + t.y;
}

export function fmtDM(iso: string): string {
  const t = dObj(iso);
  return t.d + " " + BULAN_P[t.m - 1];
}

export function fmtDayMon(iso: string): string {
  const t = dObj(iso);
  return t.d + " " + BULAN_S[t.m - 1];
}

export function prevISO(iso: string): string {
  const t = dObj(iso);
  const dt = new Date(Date.UTC(t.y, t.m - 1, t.d) - 864e5);
  const z = (n: number): string => (n < 10 ? "0" : "") + n;
  return dt.getUTCFullYear() + "-" + z(dt.getUTCMonth() + 1) + "-" + z(dt.getUTCDate());
}

export function rangeLabel(iso: string): string {
  const pv = prevISO(iso);
  const a = dObj(pv);
  const b = dObj(iso);
  if (a.m === b.m && a.y === b.y) return a.d + " → " + b.d + " " + BULAN_S[b.m - 1] + " " + b.y;
  return fmtShort(pv) + " → " + fmtShort(iso);
}
