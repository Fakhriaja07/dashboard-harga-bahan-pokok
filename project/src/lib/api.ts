// Lapisan data live — baksosapi.com (cermin pihak ketiga atas PIHPS Bank
// Indonesia & Panel Harga Pangan Bapanas). Logika fetch + parsing dipindah
// dari main.ts vanilla, tanpa perubahan perilaku.
import type { HistoryPoint, ProvPriceRow, SummaryRow } from "../types";
import { isRecord, numOrNull, validDate } from "./format";

export const API = "https://baksosapi.com/api/v1";

export const MAIN_SLUGS: string[] = ["beras-medium", "cabai-rawit", "bawang-merah", "telur-ayam"];

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

export interface LiveFetchResult {
  summary: { date: string | null; rows: SummaryRow[] } | null;
  bySlug: Record<string, SummaryRow> | null;
  prov: Record<string, Record<string, ProvPriceRow>>;
  any: boolean;
  maxProvDate: string | null;
}

function parseSummary(j: unknown): { date: string | null; rows: SummaryRow[] } | null {
  if (!isRecord(j)) return null;
  const data: unknown = j.data;
  if (!isRecord(data)) return null;
  const rowsRaw: unknown = data.rows;
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return null;
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
  if (rows.length === 0) return null;
  return { date: validDate(data.date), rows };
}

function parseProvMap(j: unknown): Record<string, ProvPriceRow> | null {
  if (!isRecord(j)) return null;
  const data: unknown = j.data;
  if (!Array.isArray(data) || data.length === 0) return null;
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
  return Object.keys(map).length > 0 ? map : null;
}

/** Ambil ringkasan nasional + harga 4 komoditas per provinsi secara
 *  bersamaan (seperti Promise.all pada skrip vanilla). Gagal fetch
 *  membuat bagiannya null — pemanggil memakai snapshot arsip. */
export async function loadLiveData(): Promise<LiveFetchResult> {
  const summaryP: Promise<{ date: string | null; rows: SummaryRow[] } | null> = fetchJSON(
    API + "/summary?level=3",
  ).then((j) => parseSummary(j));

  const provPs: Promise<{ slug: string; map: Record<string, ProvPriceRow> | null }[]> =
    Promise.all(
      MAIN_SLUGS.map((slug) =>
        fetchJSON(API + "/prices/today?commodity=" + slug + "&level=3").then((j) => ({
          slug,
          map: parseProvMap(j),
        })),
      ),
    );

  const [summary, provList] = await Promise.all([summaryP, provPs]);

  const prov: Record<string, Record<string, ProvPriceRow>> = {};
  let any = false;
  let maxProvDate: string | null = null;
  if (summary) any = true;
  provList.forEach(({ slug, map }) => {
    if (!map) return;
    prov[slug] = map;
    any = true;
    Object.keys(map).forEach((k) => {
      const d = map[k].date;
      if (d && (!maxProvDate || d > maxProvDate)) maxProvDate = d;
    });
  });

  const bySlug: Record<string, SummaryRow> | null = summary
    ? Object.fromEntries(summary.rows.map((r) => [r.slug, r]))
    : null;

  return { summary, bySlug, prov, any, maxProvDate };
}

/** Ringkasan nasional untuk satu tanggal tertentu (endpoint /summary
 *  menerima parameter date). Mengembalikan null bila tanggal itu tidak
 *  punya data (mis. akhir pekan) atau fetch gagal. */
export async function loadSummaryByDate(
  date: string,
): Promise<{ date: string | null; rows: SummaryRow[] } | null> {
  const j: unknown = await fetchJSON(API + "/summary?level=3&date=" + encodeURIComponent(date));
  return parseSummary(j);
}

function parseHistory(j: unknown): HistoryPoint[] | null {
  if (!isRecord(j)) return null;
  const data: unknown = j.data;
  if (!isRecord(data)) return null;
  const series: unknown = data.series;
  if (!Array.isArray(series) || series.length === 0) return null;
  const pts: HistoryPoint[] = [];
  series.forEach((p) => {
    if (!isRecord(p)) return;
    const d = validDate(p.date);
    const price = numOrNull(p.price);
    if (d && price !== null) pts.push({ date: d, price });
  });
  return pts.length > 0 ? pts : null;
}

/** Riwayat harga nasional satu komoditas (endpoint /history). */
export async function loadHistory(
  slug: string,
  from: string,
  to: string,
): Promise<HistoryPoint[] | null> {
  const j: unknown = await fetchJSON(
    API +
      "/history?commodity=" +
      encodeURIComponent(slug) +
      "&level=3&from=" +
      encodeURIComponent(from) +
      "&to=" +
      encodeURIComponent(to),
  );
  return parseHistory(j);
}
