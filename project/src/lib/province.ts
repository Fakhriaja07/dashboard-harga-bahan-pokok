// Logika data provinsi murni (dipindah dari main.ts vanilla, tanpa
// perubahan perilaku). Fungsi-fungsi di sini tidak menyentuh DOM.
import type { Comm, Mover, ProvMap, ProvRow } from "../types";
import { COMMS } from "../data/archive";
import { fmt } from "./format";
import { joinNames } from "./format";

/** Gabungkan data live per provinsi ke atas salinan arsip.
 *  Mengembalikan peta aktif + penanda komoditas mana yang live.
 *  (Pada skrip vanilla ini adalah buildActiveProv() + efek samping
 *  commLive; di sini keduanya dihitung murni tanpa mutasi.) */
export function buildActiveProv(
  archiveProv: ProvMap,
  liveProv: Record<string, Record<string, { price: number; prev: number | null; date: string | null }>>,
  mainSlugs: string[],
): { active: ProvMap; commLive: boolean[] } {
  const active: ProvMap = {};
  Object.keys(archiveProv).forEach((name) => {
    active[name] = archiveProv[name].slice() as ProvRow;
  });
  const commLive: boolean[] = [false, false, false, false, false];
  mainSlugs.forEach((slug, i) => {
    const map = liveProv[slug];
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
  return { active, commLive };
}

export interface MoversResult {
  ups: Mover[];
  downs: Mover[];
}

/** Pergerakan terbesar dari data provinsi aktif (logika renderMoversLive
 *  pada skrip vanilla, tanpa penulisan DOM). Hanya komoditas live yang
 *  dihitung; Minyakita tidak pernah live. */
export function computeMovers(
  prov: ProvMap,
  provNames: string[],
  commLive: boolean[],
): MoversResult {
  const ups: Mover[] = [];
  const downs: Mover[] = [];
  COMMS.forEach((c, i) => {
    if (!commLive[i]) return;
    provNames.forEach((name) => {
      const a = prov[name];
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
  return { ups, downs };
}

export interface ExtremeRow {
  comm: Comm;
  isMinyakita: boolean;
  min: number;
  minNames: string[];
  max: number;
  maxNames: string[];
}

/** Termurah & termahal per komoditas (logika renderExtremesLive pada
 *  skrip vanilla, tanpa penulisan DOM). */
export function computeExtremes(prov: ProvMap, provNames: string[]): ExtremeRow[] {
  const rows: ExtremeRow[] = [];
  COMMS.forEach((c, i) => {
    let min: number | null = null;
    let max: number | null = null;
    let minN: string[] = [];
    let maxN: string[] = [];
    provNames.forEach((name) => {
      const v = prov[name][i * 2];
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
    rows.push({ comm: c, isMinyakita: i === 4, min, minNames: minN, max, maxNames: maxN });
  });
  return rows;
}

/** Format "Provinsi A, Provinsi B & Provinsi C" untuk sel termurah/termahal. */
export function extremeNames(names: string[]): string {
  return joinNames(names);
}

/** Format harga "Rp12.631" untuk sel termurah/termahal. */
export function extremePrice(v: number): string {
  return "Rp" + fmt(v);
}
