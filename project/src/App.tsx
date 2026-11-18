// Komponen utama: state data live/arsip, fetch saat mount, render semua section.
// Alur fetch sama persis dengan skrip vanilla (ringkasan nasional + 4 komoditas
// provinsi secara bersamaan, lalu applySummary / applyProvinsi / finalize).
import { useEffect, useState } from "react";
import type { CatGroup, PriceItem, Tick } from "./types";
import {
  ARCHIVE_CATS,
  ARCHIVE_NAS17,
  ARCHIVE_PROV,
  ARCHIVE_TICKS,
  CAT_DEFS,
  NAT_MAP,
} from "./data/archive";
import { loadLiveData, MAIN_SLUGS } from "./lib/api";
import { fmtShort } from "./lib/dates";
import { loadTimeWIB } from "./lib/format";
import { buildActiveProv } from "./lib/province";
import Masthead from "./components/Masthead";
import Indicators from "./components/Indicators";
import NationalTable from "./components/NationalTable";
import BpsContext from "./components/BpsContext";
import ProvinceSection from "./components/ProvinceSection";
import Sources from "./components/Sources";

export default function App(): React.JSX.Element {
  const [cats, setCats] = useState<CatGroup[]>(ARCHIVE_CATS);
  const [ticks, setTicks] = useState<Tick[]>(ARCHIVE_TICKS);
  const [prov, setProv] = useState(ARCHIVE_PROV);
  const [nas17, setNas17] = useState<number[]>(ARCHIVE_NAS17);
  const [commLive, setCommLive] = useState<boolean[]>([false, false, false, false, false]);
  const [liveProvDate, setLiveProvDate] = useState<string | null>(null);
  const [bySlugPresent, setBySlugPresent] = useState(false);
  const [summaryDate, setSummaryDate] = useState<string | null>(null);
  const [liveAny, setLiveAny] = useState(false);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);
  const [ubTime] = useState<string>(() => loadTimeWIB());

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
          });
        });
        setCats(summaryCats);
        setSummaryDate(date);
        setBySlugPresent(true);
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
          cats={cats}
          summaryDate={summaryDate}
          liveAny={liveAny}
          finalized={finalized}
        />
        <BpsContext />
        <ProvinceSection
          prov={prov}
          nas17={nas17}
          commLive={commLive}
          liveProvDate={liveProvDate}
          bySlugPresent={bySlugPresent}
          dataDate={dataDate}
        />
      </main>
      <Sources footStatus={footStatus} />
    </>
  );
}
