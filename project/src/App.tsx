// Komponen utama: state data live/arsip, fetch saat mount, render semua section.
// Alur fetch sama persis dengan skrip vanilla (ringkasan nasional + 4 komoditas
// provinsi secara bersamaan, lalu applySummary / applyProvinsi / finalize).
import { useEffect, useRef, useState } from "react";
import type { CatGroup, PriceItem, SummaryRow, Tick } from "./types";
import {
  ARCHIVE_CATS,
  ARCHIVE_NAS17,
  ARCHIVE_PROV,
  ARCHIVE_TICKS,
  CAT_DEFS,
  NAT_MAP,
} from "./data/archive";
import { loadLiveData, loadSummaryByDate, MAIN_SLUGS } from "./lib/api";
import { addDaysISO, fmtShort, MIN_DATA_DATE } from "./lib/dates";
import { loadTimeWIB } from "./lib/format";
import { buildActiveProv } from "./lib/province";
import Masthead from "./components/Masthead";
import Indicators from "./components/Indicators";
import NationalTable from "./components/NationalTable";
import BpsContext from "./components/BpsContext";
import ProvinceSection from "./components/ProvinceSection";
import Sources from "./components/Sources";

/** Susun grup kategori tabel nasional dari baris ringkasan API
 *  (dipakai untuk data terbaru maupun data tanggal lampau). */
function buildCats(bySlug: Record<string, SummaryRow>): CatGroup[] {
  const summaryCats: CatGroup[] = CAT_DEFS.map((c) => ({
    id: c.id,
    label: c.label,
    items: [] as PriceItem[],
  }));
  NAT_MAP.forEach((m) => {
    const r = bySlug[m.slug];
    if (!r) return;
    summaryCats[m.cat].items.push({
      name: m.name,
      price: r.avg,
      chg: typeof r.prev === "number" ? r.avg - r.prev : null,
      pct: typeof r.changePct === "number" ? r.changePct * 100 : null,
      slug: m.slug,
    });
  });
  return summaryCats;
}

export default function App(): React.JSX.Element {
  const [cats, setCats] = useState<CatGroup[]>(ARCHIVE_CATS);
  const [ticks, setTicks] = useState<Tick[]>(ARCHIVE_TICKS);
  const [prov, setProv] = useState(ARCHIVE_PROV);
  const [nas17, setNas17] = useState<number[]>(ARCHIVE_NAS17);
  const [commLive, setCommLive] = useState<boolean[]>([false, false, false, false, false]);
  const [liveProvDate, setLiveProvDate] = useState<string | null>(null);
  const [summaryDate, setSummaryDate] = useState<string | null>(null);
  const [liveAny, setLiveAny] = useState(false);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [ubTime] = useState<string>(() => loadTimeWIB());
  // Navigasi tanggal tabel nasional: null = menampilkan data terbaru.
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [viewCats, setViewCats] = useState<CatGroup[] | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewNote, setViewNote] = useState<string | null>(null);
  const viewReqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadLiveData().then((live) => {
      if (cancelled) return;
      const date: string | null =
        live.summary && live.summary.date ? live.summary.date : live.maxProvDate;
      if (live.summary) {
        const bySlug = live.bySlug ?? {};
        setTicks(
          live.summary.rows.map((r) => ({
            name: r.name,
            price: r.avg,
            chg: typeof r.prev === "number" ? r.avg - r.prev : null,
          })),
        );
        setCats(buildCats(bySlug));
        setSummaryDate(date);
      }
      if (MAIN_SLUGS.some((s) => !!live.prov[s])) {
        const { active, commLive: cl } = buildActiveProv(ARCHIVE_PROV, live.prov, MAIN_SLUGS);
        setProv(active);
        setCommLive(cl);
        setLiveProvDate(live.maxProvDate ?? date);
        if (live.bySlug) {
          const nextNas17 = ARCHIVE_NAS17.slice();
          MAIN_SLUGS.forEach((slug, i) => {
            const r = live.bySlug?.[slug];
            if (r) nextNas17[i] = r.avg;
          });
          setNas17(nextNas17);
        }
      }
      setLiveAny(live.any);
      setDataDate(date);
      setFinalized(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function resetToLatest(): void {
    viewReqRef.current += 1;
    setViewDate(null);
    setViewCats(null);
    setViewNote(null);
    setViewLoading(false);
  }

  /** Pindah ke tanggal target; bila tanggal itu kosong (akhir pekan/libur),
   *  geser selangkah demi selangkah ke arah dir (maks. 8 hari) sampai
   *  ketemu tanggal yang punya data. */
  async function goToDate(target: string, dir: 1 | -1): Promise<void> {
    if (!summaryDate) return;
    if (target >= summaryDate) {
      resetToLatest();
      return;
    }
    const req = viewReqRef.current + 1;
    viewReqRef.current = req;
    setViewLoading(true);
    setViewNote(null);
    let d = target;
    for (let i = 0; i < 8; i++) {
      if (d < MIN_DATA_DATE || d > summaryDate) break;
      const s = await loadSummaryByDate(d);
      if (viewReqRef.current !== req) return;
      if (s && s.rows.length > 0) {
        const bySlug = Object.fromEntries(s.rows.map((r) => [r.slug, r]));
        setViewCats(buildCats(bySlug));
        setViewDate(s.date ?? d);
        if (d !== target) {
          setViewNote(
            "Tidak ada data untuk " +
              fmtShort(target) +
              " — menampilkan data terdekat " +
              (dir < 0 ? "sebelumnya" : "sesudahnya") +
              ", " +
              fmtShort(d) +
              ".",
          );
        }
        setViewLoading(false);
        return;
      }
      d = addDaysISO(d, dir);
    }
    if (viewReqRef.current !== req) return;
    setViewLoading(false);
    setViewNote("Tidak ada data untuk tanggal itu. Coba tanggal lain.");
  }

  const footStatus =
    finalized && liveAny && dataDate
      ? "Data live: " + fmtShort(dataDate) + " · arsip cadangan 16–17 Nov 2026"
      : "Snapshot data: 16–17 Nov 2026";

  return (
    <>
      <Masthead
        finalized={finalized}
        liveAny={liveAny}
        dataDate={dataDate}
        ubTime={ubTime}
        ticks={ticks}
      />
      <div className="wrap">
        <div className="archive-note" id="archiveBanner" hidden={!(finalized && !liveAny)}>
          <strong>Mode arsip</strong> — data 17 Nov 2026, pembaruan live tidak tersedia saat ini.
          Halaman menampilkan snapshot terakhir yang tersimpan di dalamnya.
        </div>
      </div>
      <Indicators />
      <nav className="jumpnav" aria-label="Loncat ke bagian">
        <div className="wrap">
          <a href="#nasional">Harga Nasional</a>
          <a href="#konteks">Konteks BPS</a>
          <a href="#provinsi">Per Provinsi</a>
          <a href="#sumber">Sumber Data</a>
        </div>
      </nav>
      <main className="wrap">
        <NationalTable
          cats={viewCats ?? cats}
          summaryDate={viewDate ?? summaryDate}
          liveAny={liveAny}
          finalized={finalized}
          latestDate={summaryDate}
          viewDate={viewDate}
          viewLoading={viewLoading}
          viewNote={viewNote}
          onPickDate={(d) => void goToDate(d, -1)}
          onPrevDay={() => {
            const base = viewDate ?? summaryDate;
            if (base) void goToDate(addDaysISO(base, -1), -1);
          }}
          onNextDay={() => {
            const base = viewDate ?? summaryDate;
            if (base) void goToDate(addDaysISO(base, 1), 1);
          }}
          onLatest={resetToLatest}
        />
        <BpsContext />
        <ProvinceSection
          prov={prov}
          nas17={nas17}
          commLive={commLive}
          liveProvDate={liveProvDate}
        />
      </main>
      <Sources footStatus={footStatus} />
    </>
  );
}
