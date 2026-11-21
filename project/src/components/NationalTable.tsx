// Section Harga Nasional (logika render() + applySummary pada skrip vanilla,
// sebagai JSX). State pencarian & filter kategori bersifat lokal.
// Navigasi tanggal (pemilih tanggal + hari sebelum/sesudah) dan grafik tren
// per komoditas ditambahkan 21 Nov 2026 — data per tanggal dari API.
import { useEffect, useRef, useState } from "react";
import type { CatGroup, HistoryPoint, PriceItem } from "../types";
import { CAT_DEFS } from "../data/archive";
import { loadHistory } from "../lib/api";
import { fmt } from "../lib/format";
import { addDaysISO, dObj, fmtDM, fmtLong, fmtShort, MIN_DATA_DATE, prevISO } from "../lib/dates";
import TrendChart from "./TrendChart";

function ChgSpan({ it }: { it: PriceItem }): React.JSX.Element {
  if (it.chg === null || it.chg === undefined) {
    return (
      <span className="chg flat" title="Tidak dilaporkan PIHPS">
        —
      </span>
    );
  }
  if (it.chg === 0) {
    return (
      <span className="chg flat">
        0{" "}
        <span className="pct">(0,00%)</span>
      </span>
    );
  }
  const up = it.chg > 0;
  const p =
    it.pct !== null && it.pct !== undefined
      ? it.pct
          .toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          .replace("-", "")
      : null;
  return (
    <span className={up ? "chg up" : "chg down"}>
      {up ? "▲" : "▼"} {up ? "+" : "−"}
      {fmt(Math.abs(it.chg))}
      {p !== null ? (
        <>
          {" "}
          <span className="pct">
            ({up ? "+" : "−"}
            {p}%)
          </span>
        </>
      ) : null}
    </span>
  );
}

const CHIPS: { id: string; label: string }[] = [
  { id: "semua", label: "Semua" },
  ...CAT_DEFS.map((c) => ({ id: c.id, label: c.label })),
];

interface NationalTableProps {
  cats: CatGroup[];
  /** Tanggal data yang sedang ditampilkan (null = masih arsip). */
  summaryDate: string | null;
  liveAny: boolean;
  finalized: boolean;
  /** Tanggal data live paling baru (null bila live gagal). */
  latestDate: string | null;
  /** Tanggal lampau yang sedang dilihat; null = data terbaru. */
  viewDate: string | null;
  viewLoading: boolean;
  viewNote: string | null;
  onPickDate: (date: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onLatest: () => void;
}

export default function NationalTable({
  cats,
  summaryDate,
  liveAny,
  finalized,
  latestDate,
  viewDate,
  viewLoading,
  viewNote,
  onPickDate,
  onPrevDay,
  onNextDay,
  onLatest,
}: NationalTableProps): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("semua");
  const [trend, setTrend] = useState<{ slug: string; name: string } | null>(null);
  const [trendPts, setTrendPts] = useState<HistoryPoint[] | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendErr, setTrendErr] = useState(false);
  const trendCacheRef = useRef<Map<string, HistoryPoint[]>>(new Map());
  const trendReqRef = useRef(0);

  // Riwayat tren: 90 hari berakhir pada tanggal yang sedang ditampilkan.
  useEffect(() => {
    if (!trend || !summaryDate) return;
    const to = summaryDate;
    const from = addDaysISO(to, -89);
    const key = trend.slug + "|" + from + "|" + to;
    const cached = trendCacheRef.current.get(key);
    if (cached) {
      setTrendPts(cached);
      setTrendErr(false);
      setTrendLoading(false);
      return;
    }
    const req = trendReqRef.current + 1;
    trendReqRef.current = req;
    setTrendLoading(true);
    setTrendErr(false);
    setTrendPts(null);
    loadHistory(trend.slug, from, to).then((pts) => {
      if (trendReqRef.current !== req) return;
      setTrendLoading(false);
      if (pts) {
        trendCacheRef.current.set(key, pts);
        setTrendPts(pts);
      } else {
        setTrendErr(true);
      }
    });
  }, [trend, summaryDate]);

  function toggleTrend(it: PriceItem): void {
    if (!it.slug) return;
    setTrend((cur) => (cur && cur.slug === it.slug ? null : { slug: it.slug as string, name: it.name }));
  }

  const q = query.trim().toLowerCase();
  let any = false;
  const rows: React.JSX.Element[] = [];
  cats.forEach((cat) => {
    if (activeCat !== "semua" && activeCat !== cat.id) return;
    const items = cat.items.filter((it) => !q || it.name.toLowerCase().indexOf(q) !== -1);
    if (items.length === 0) return;
    any = true;
    rows.push(
      <tr className="cat-row" key={cat.id}>
        <td colSpan={3}>{cat.label}</td>
      </tr>,
    );
    items.forEach((it) => {
      rows.push(
        <tr key={cat.id + "/" + it.name}>
          <td>
            <span className="item-name">{it.name}</span>
            {it.slug ? (
              <button
                className="trendbtn"
                type="button"
                aria-pressed={trend !== null && trend.slug === it.slug ? "true" : "false"}
                onClick={() => toggleTrend(it)}
              >
                Tren
              </button>
            ) : null}
          </td>
          <td className="num price">{fmt(it.price)}</td>
          <td className="num">
            <ChgSpan it={it} />
          </td>
        </tr>,
      );
    });
  });

  const effDate = summaryDate;
  const atEarliest = effDate !== null && effDate <= MIN_DATA_DATE;

  return (
    <section id="nasional" aria-labelledby="h-nasional">
      <div className="sec-head">
        <h2 id="h-nasional">
          Harga Nasional — <span className="hl">Pasar Tradisional</span>
        </h2>
        <div className="sec-meta" id="natMeta">
          {summaryDate ? (
            <>
              SUMBER: <b>PIHPS &amp; BAPANAS VIA BAKSOSAPI.COM</b>
              <br />
              DATA {fmtShort(summaryDate).toUpperCase()} · {viewDate ? "RIWAYAT" : "LIVE"}
            </>
          ) : finalized && liveAny ? (
            <>
              SUMBER: <b>PIHPS NASIONAL (BANK INDONESIA)</b>
              <br />
              UPDATE 17 NOV 2026 · MODE ARSIP
            </>
          ) : (
            <>
              SUMBER: <b>PIHPS NASIONAL (BANK INDONESIA)</b>
              <br />
              UPDATE 17 NOV 2026 · 19.37 WIB
            </>
          )}
        </div>
      </div>
      <p className="sec-lede" id="natLede">
        {summaryDate && viewDate ? (
          <>
            Menampilkan harga eceran nasional pada {fmtLong(viewDate)} dari API baksosapi.com (cermin
            data PIHPS Bank Indonesia &amp; Panel Harga Pangan Bapanas). Kolom perubahan adalah selisih
            terhadap hari pelaporan sebelumnya. Gunakan pemilih tanggal atau tombol hari sebelum/sesudah
            untuk berpindah hari.
          </>
        ) : summaryDate ? (
          <>
            Harga eceran nasional per kilogram di pasar tradisional — 11 komoditas yang diambil live dari
            API baksosapi.com (cermin data PIHPS Bank Indonesia &amp; Panel Harga Pangan Bapanas) setiap
            halaman ini dibuka. Kolom perubahan adalah selisih terhadap hari sebelumnya (
            {fmtShort(prevISO(summaryDate))}). Komoditas “Cabai Merah” memakai nama sesuai API — API tidak
            merinci variannya, jadi jangan disamakan dengan “cabai merah besar” PIHPS pada data arsip.
          </>
        ) : (
          <>
            Harga eceran nasional per kilogram di pasar tradisional. Kolom perubahan adalah perubahan
            terhadap hari sebelumnya, seperti dilaporkan PIHPS pada 17 November 2026. Cabai rawit merah dan
            telur ayam ras berasal dari update pukul 10.20 WIB di hari yang sama.
          </>
        )}
      </p>

      {latestDate && effDate ? (
        <>
          <div className="datebar">
            <button
              className="datebtn"
              type="button"
              onClick={onPrevDay}
              disabled={viewLoading || atEarliest}
            >
              ← Hari sebelumnya
            </button>
            <label className="datepick">
              <span>Tanggal data</span>
              <input
                type="date"
                min={MIN_DATA_DATE}
                max={latestDate}
                value={effDate}
                disabled={viewLoading}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && v !== effDate) onPickDate(v);
                }}
              />
            </label>
            <button
              className="datebtn"
              type="button"
              onClick={onNextDay}
              disabled={viewLoading || !viewDate}
            >
              Hari sesudahnya →
            </button>
            {viewDate ? (
              <button className="datebtn latest" type="button" onClick={onLatest} disabled={viewLoading}>
                Terbaru
              </button>
            ) : null}
            {viewLoading ? <span className="dateloading">Memuat…</span> : null}
          </div>
          {viewNote ? <p className="datenote">{viewNote}</p> : null}
          {viewDate ? (
            <p className="datenote">
              Bagian per provinsi di bawah tetap memakai data terakhir ({fmtShort(latestDate)}) — sumber
              tidak menyediakan riwayat harga per provinsi.
            </p>
          ) : null}
        </>
      ) : null}

      <div className="controls">
        <label className="search">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            id="searchInput"
            type="search"
            placeholder="Cari komoditas… misalnya “cabai” atau “beras super”"
            aria-label="Cari komoditas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Filter kategori" id="catChips">
          {CHIPS.map((c) => (
            <button
              className="chip"
              type="button"
              data-cat={c.id}
              aria-pressed={activeCat === c.id ? "true" : "false"}
              key={c.id}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <table
          className="ptable"
          id="natTable"
          aria-label={
            summaryDate
              ? "Harga bahan pokok nasional PIHPS & Bapanas via baksosapi.com, data " +
                (viewDate ? "riwayat " : "live ") +
                fmtDM(summaryDate) +
                " " +
                dObj(summaryDate).y
              : "Harga bahan pokok nasional PIHPS 17 November 2026"
          }
        >
          <thead>
            <tr>
              <th scope="col">Komoditas</th>
              <th scope="col" className="num">
                Harga (Rp/kg)
              </th>
              <th scope="col" className="num">
                Perubahan vs kemarin
              </th>
            </tr>
          </thead>
          <tbody id="priceBody">{rows}</tbody>
        </table>
        <div className="empty-msg" id="emptyMsg" hidden={any}>
          Tidak ada komoditas yang cocok dengan pencarian itu.
        </div>
      </div>

      {trend ? (
        <TrendChart
          name={trend.name}
          pts={trendPts}
          loading={trendLoading}
          err={trendErr}
          onClose={() => setTrend(null)}
        />
      ) : null}

      <p className="cmp-table-note" id="natNote">
        {summaryDate
          ? "Tanda “—” pada kolom perubahan berarti API tidak melaporkan harga kemarin untuk komoditas tersebut."
          : "Tanda “—” pada kolom perubahan berarti PIHPS tidak melaporkan perubahan untuk komoditas tersebut pada 17 November 2026."}
      </p>
    </section>
  );
}
