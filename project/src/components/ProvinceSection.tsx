// Section Harga per Provinsi (logika renderProv/renderRank/renderMoversLive/
// renderExtremesLive/applyProvinsi pada skrip vanilla, sebagai JSX).
// - Detail & peringkat selalu dirender dari state `prov` (arsip dulu,
//   lalu data live bila applyProvinsi berjalan).
// - Pergerakan Terbesar & Termurah/Termahal: bila belum ada tanggal live,
//   tampilkan konten arsip STATIS yang sama persis dengan markup awal
//   index.html vanilla (catatan dan sel Minyakita-nya ditulis tangan di
//   sana, tidak sama dengan hasil hitung fungsi live); bila sudah live,
//   hitung dari state aktif seperti skrip vanilla.
import { useEffect, useMemo, useState } from "react";
import type { ProvMap } from "../types";
import { COMMS, ARCHIVE_PROV } from "../data/archive";
import { MAIN_SLUGS } from "../lib/api";
import { fmt } from "../lib/format";
import { dObj, fmtDM, fmtDayMon, fmtShort, prevISO, rangeLabel } from "../lib/dates";
import { computeExtremes, computeMovers, extremeNames, extremePrice } from "../lib/province";

function ProvChgSpan({ v17, v16 }: { v17: number | null; v16: number | null }): React.JSX.Element {
  if (v17 === null || v16 === null) {
    return (
      <span className="chg flat" title="Belum dilaporkan provinsi">
        —
      </span>
    );
  }
  const d = v17 - v16;
  if (d === 0) {
    return (
      <span className="chg flat">
        0{" "}
        <span className="pct">(0,00%)</span>
      </span>
    );
  }
  const up = d > 0;
  const p = (((v17 - v16) / v16) * 100)
    .toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace("-", "");
  return (
    <span className={up ? "chg up" : "chg down"}>
      {up ? "▲ +" : "▼ −"}
      {fmt(Math.abs(d))}{" "}
      <span className="pct">
        ({up ? "+" : "−"}
        {p}%)
      </span>
    </span>
  );
}

function VsSpan({ v17, nas }: { v17: number | null; nas: number }): React.JSX.Element {
  if (v17 === null) return <span className="vs na">—</span>;
  const d = v17 - nas;
  if (d === 0) return <span className="vs same">Sama dengan nasional</span>;
  if (d < 0) return <span className="vs cheap">−{fmt(-d)} lebih murah</span>;
  return <span className="vs exp">+{fmt(d)} lebih mahal</span>;
}

/* ---- Konten arsip STATIS (salinan persis markup awal index.html) ---- */
const ARCHIVE_MV_UP: React.JSX.Element[] = [
  <div className="mv-row" key="ps-minyakita">
    <div className="mv-name">
      Papua Selatan<span>Minyakita · /liter</span>
    </div>
    <span className="chg up">
      ▲ +7.725{" "}
      <span className="pct">(+49,20%)</span>
    </span>
  </div>,
  <div className="mv-row" key="ps-beras">
    <div className="mv-name">
      Papua Selatan<span>Beras medium · /kg</span>
    </div>
    <span className="chg up">
      ▲ +1.813{" "}
      <span className="pct">(+13,07%)</span>
    </span>
  </div>,
  <div className="mv-row" key="ps-bawang">
    <div className="mv-name">
      Papua Selatan<span>Bawang merah · /kg</span>
    </div>
    <span className="chg up">
      ▲ +5.000{" "}
      <span className="pct">(+9,09%)</span>
    </span>
  </div>,
  <div className="mv-row" key="ks-cabai">
    <div className="mv-name">
      Kalimantan Selatan<span>Cabai rawit merah · /kg</span>
    </div>
    <span className="chg up">
      ▲ +5.417{" "}
      <span className="pct">(+5,10%)</span>
    </span>
  </div>,
  <div className="mv-row" key="ps-cabai">
    <div className="mv-name">
      Papua Selatan<span>Cabai rawit merah · /kg</span>
    </div>
    <span className="chg up">
      ▲ +6.500{" "}
      <span className="pct">(+4,41%)</span>
    </span>
  </div>,
];

const ARCHIVE_MV_DOWN: React.JSX.Element[] = [
  <div className="mv-row" key="pbd-cabai">
    <div className="mv-name">
      Papua Barat Daya<span>Cabai rawit merah · /kg</span>
    </div>
    <span className="chg down">
      ▼ −11.705{" "}
      <span className="pct">(−10,07%)</span>
    </span>
  </div>,
  <div className="mv-row" key="kt-cabai">
    <div className="mv-name">
      Kalimantan Timur<span>Cabai rawit merah · /kg</span>
    </div>
    <span className="chg down">
      ▼ −4.555{" "}
      <span className="pct">(−5,11%)</span>
    </span>
  </div>,
  <div className="mv-row" key="su-cabai">
    <div className="mv-name">
      Sumatera Utara<span>Cabai rawit merah · /kg</span>
    </div>
    <span className="chg down">
      ▼ −2.976{" "}
      <span className="pct">(−4,14%)</span>
    </span>
  </div>,
  <div className="mv-row" key="sb-cabai">
    <div className="mv-name">
      Sulawesi Barat<span>Cabai rawit merah · /kg</span>
    </div>
    <span className="chg down">
      ▼ −4.266{" "}
      <span className="pct">(−4,05%)</span>
    </span>
  </div>,
];

const ARCHIVE_EXTREMES: React.JSX.Element[] = [
  <tr key="Beras Medium">
    <td>
      <span className="item-name">Beras medium</span> <span className="item-unit">/kg</span>
    </td>
    <td>
      <span className="ext-prov">Jambi</span>
      <span className="ext-price">Rp12.631</span>
    </td>
    <td>
      <span className="ext-prov">Papua Pegunungan</span>
      <span className="ext-price">Rp20.000</span>
    </td>
  </tr>,
  <tr key="Cabai Rawit Merah">
    <td>
      <span className="item-name">Cabai rawit merah</span> <span className="item-unit">/kg</span>
    </td>
    <td>
      <span className="ext-prov">Nusa Tenggara Barat</span>
      <span className="ext-price">Rp53.508</span>
    </td>
    <td>
      <span className="ext-prov">Papua Selatan</span>
      <span className="ext-price">Rp154.000</span>
    </td>
  </tr>,
  <tr key="Bawang Merah">
    <td>
      <span className="item-name">Bawang merah</span> <span className="item-unit">/kg</span>
    </td>
    <td>
      <span className="ext-prov">Nusa Tenggara Timur</span>
      <span className="ext-price">Rp26.860</span>
    </td>
    <td>
      <span className="ext-prov">Papua Selatan &amp; Papua Barat</span>
      <span className="ext-price">Rp60.000</span>
    </td>
  </tr>,
  <tr key="Telur Ayam">
    <td>
      <span className="item-name">Telur ayam</span> <span className="item-unit">/kg</span>
    </td>
    <td>
      <span className="ext-prov">Jawa Timur</span>
      <span className="ext-price">Rp23.132</span>
    </td>
    <td>
      <span className="ext-prov">Papua Selatan</span>
      <span className="ext-price">Rp51.429</span>
    </td>
  </tr>,
  <tr key="Minyakita">
    <td>
      <span className="item-name">Minyakita</span> <span className="item-unit">/liter</span>
    </td>
    <td>
      <span className="ext-prov">Bali</span>
      <span className="ext-price">Rp15.700</span>
      <span className="ext-note">Juga Banten, Gorontalo, Papua Tengah</span>
    </td>
    <td>
      <span className="ext-prov">Papua Selatan</span>
      <span className="ext-price">Rp23.425</span>
    </td>
  </tr>,
];

const STATIC_PROV_NOTE =
  "Rata-rata nasional Bapanas 17 Nov 2026: beras medium Rp13.728/kg · cabai rawit merah Rp86.209/kg · bawang merah Rp35.774/kg · telur ayam Rp27.861/kg · Minyakita Rp16.895/liter. Tanda “—” berarti provinsi belum melaporkan komoditas itu: Papua Pegunungan (bawang merah, Minyakita) dan Papua Tengah (cabai rawit merah), pada kedua tanggal.";

interface ProvinceSectionProps {
  prov: ProvMap;
  nas17: number[];
  commLive: boolean[];
  /** Tanggal data provinsi live (null = masih arsip). */
  liveProvDate: string | null;
  /** Apakah ringkasan nasional live tersedia (untuk catatan provNote). */
  bySlugPresent: boolean;
  /** Tanggal data live (summary.date ?? maxProvDate). */
  dataDate: string | null;
}

export default function ProvinceSection({
  prov,
  nas17,
  commLive,
  liveProvDate,
  bySlugPresent,
  dataDate,
}: ProvinceSectionProps): React.JSX.Element {
  const [selectedProv, setSelectedProv] = useState("Aceh");
  const [rankCi, setRankCi] = useState(1);

  const provNames = useMemo(
    () => Object.keys(prov).sort((a, b) => a.localeCompare(b, "id")),
    [prov],
  );

  useEffect(() => {
    if (!provNames.includes(selectedProv)) setSelectedProv("Aceh");
  }, [provNames, selectedProv]);

  const live = liveProvDate !== null;
  const a = prov[selectedProv] ?? ARCHIVE_PROV["Aceh"];

  /* ----- Detail provinsi (renderProv) ----- */
  const detailRows = COMMS.map((c, i) => {
    const v17 = a[i * 2];
    const v16 = a[i * 2 + 1];
    const tag =
      liveProvDate !== null && !commLive[i] ? (
        <span className="row-tag">data 17 Nov · vs 16 Nov</span>
      ) : null;
    return (
      <tr key={c.name}>
        <td>
          <span className="item-name">{c.name}</span> <span className="item-unit">{c.unit}</span>
          {tag}
        </td>
        <td className="num price">{v17 === null ? "—" : fmt(v17)}</td>
        <td className="num">
          <ProvChgSpan v17={v17} v16={v16} />
        </td>
        <td className="num hide-sm">
          <VsSpan v17={v17} nas={nas17[i]} />
        </td>
      </tr>
    );
  });

  /* ----- Peringkat (renderRank) ----- */
  const rankRows = provNames
    .map((name) => {
      const row = prov[name];
      return { name, v17: row[rankCi * 2], v16: row[rankCi * 2 + 1] };
    })
    .sort((x, y) => {
      if (x.v17 === null) return 1;
      if (y.v17 === null) return -1;
      return y.v17 - x.v17;
    })
    .map((r, i) => (
      <tr key={r.name}>
        <td className="rank-num">{i + 1}</td>
        <td>
          <span className="item-name">{r.name}</span>
        </td>
        <td className="num price">{r.v17 === null ? "—" : fmt(r.v17)}</td>
        <td className="num">
          <ProvChgSpan v17={r.v17} v16={r.v16} />
        </td>
      </tr>
    ));

  /* ----- Pergerakan Terbesar (renderMoversLive) / arsip statis ----- */
  const movers = live ? computeMovers(prov, provNames, commLive) : null;
  const mvUps = movers ? movers.ups.slice(0, 5) : [];
  const mvDowns = movers ? movers.downs.slice(0, 5) : [];
  const mvHead = live
    ? "Pergerakan Terbesar, " + rangeLabel(liveProvDate)
    : "Pergerakan Terbesar, 16 → 17 Nov 2026";
  const mvDownSub = !live
    ? "Semuanya cabai rawit merah"
    : mvDowns.length > 0 && mvDowns.every((e) => e.comm === mvDowns[0].comm)
      ? "Semuanya " + mvDowns[0].comm.toLowerCase()
      : "Berdasarkan persen perubahan";
  const mvUpNote = !live ? (
    <>
      <b>Catatan:</b> lonjakan Minyakita di Papua Selatan (+49,20% dalam sehari, Rp15.700 → Rp23.425)
      sangat besar — kemungkinan pelaporan di provinsi itu masih terbatas, tetapi angka inilah yang
      dilaporkan Bapanas.
    </>
  ) : (
    (() => {
      const extreme = movers ? movers.ups.filter((e) => e.pct > 10) : [];
      if (extreme.length > 0) {
        const e0 = extreme[0];
        return (
          <>
            <b>Catatan:</b> ada kenaikan di atas 10% dalam sehari — terbesar{" "}
            {e0.comm.toLowerCase()} di {e0.prov} (+
            {e0.pct.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            %) — lonjakan sebesar itu kemungkinan karena pelaporan di provinsi tersebut masih terbatas,
            tetapi angka inilah yang dilaporkan sumber data.
          </>
        );
      }
      return (
        <>
          Dihitung dari data live {fmtShort(liveProvDate)} terhadap hari sebelumnya, untuk komoditas
          yang tersedia di API. Minyakita tidak termasuk karena masih data 17 Nov 2026.
        </>
      );
    })()
  );
  const mvDownNote = !live
    ? "Jawa Timur, Papua Selatan, dan Sumatera Barat mencatat kenaikan di kelima komoditas. Sebaliknya, Kalimantan Barat, Kalimantan Tengah, Maluku, Sulawesi Tenggara, dan Papua Pegunungan tidak mencatat satu pun komoditas naik."
    : "Dihitung dari data live " +
      fmtShort(liveProvDate) +
      " terhadap hari sebelumnya untuk komoditas live; Minyakita tidak termasuk karena belum tersedia di API (tetap data 17 Nov 2026).";

  const mvUpContent = live ? (
    mvUps.length > 0 ? (
      mvUps.map((e) => (
        <div className="mv-row" key={e.prov + "/" + e.comm}>
          <div className="mv-name">
            {e.prov}
            <span>
              {e.comm} · {e.unit}
            </span>
          </div>
          <ProvChgSpan v17={e.v17} v16={e.v16} />
        </div>
      ))
    ) : (
      <div className="mv-row">
        <div className="mv-name">Tidak ada kenaikan pada komoditas live</div>
      </div>
    )
  ) : (
    ARCHIVE_MV_UP
  );
  const mvDownContent = live ? (
    mvDowns.length > 0 ? (
      mvDowns.map((e) => (
        <div className="mv-row" key={e.prov + "/" + e.comm}>
          <div className="mv-name">
            {e.prov}
            <span>
              {e.comm} · {e.unit}
            </span>
          </div>
          <ProvChgSpan v17={e.v17} v16={e.v16} />
        </div>
      ))
    ) : (
      <div className="mv-row">
        <div className="mv-name">Tidak ada penurunan pada komoditas live</div>
      </div>
    )
  ) : (
    ARCHIVE_MV_DOWN
  );

  /* ----- Termurah & Termahal (renderExtremesLive) / arsip statis ----- */
  const extremes = live ? computeExtremes(prov, provNames) : null;
  const extRows = live
    ? (extremes ?? []).map((r) => (
        <tr key={r.comm.name}>
          <td>
            <span className="item-name">{r.comm.name}</span>{" "}
            <span className="item-unit">{r.comm.unit}</span>
            {r.isMinyakita ? <span className="ext-note">Data 17 Nov 2026</span> : null}
          </td>
          <td>
            <span className="ext-prov">{extremeNames(r.minNames)}</span>
            <span className="ext-price">{extremePrice(r.min)}</span>
          </td>
          <td>
            <span className="ext-prov">{extremeNames(r.maxNames)}</span>
            <span className="ext-price">{extremePrice(r.max)}</span>
          </td>
        </tr>
      ))
    : ARCHIVE_EXTREMES;
  const extNote = live
    ? "Harga rata-rata eceran " + fmtShort(liveProvDate) + " dari data live · Minyakita: data 17 Nov 2026."
    : "Harga rata-rata eceran 17 Nov 2026 menurut Bapanas.";
  const extAriaLabel = live
    ? "Provinsi termurah dan termahal per komoditas dari data live " +
      fmtDM(liveProvDate) +
      " " +
      dObj(liveProvDate).y +
      "; Minyakita data 17 November 2026"
    : "Provinsi termurah dan termahal per komoditas menurut Bapanas 17 November 2026";

  /* ----- Catatan provinsi (applyProvinsi) / arsip statis ----- */
  let provNote = STATIC_PROV_NOTE;
  if (live) {
    const avgParts = COMMS.map((c, i) => c.name.toLowerCase() + " Rp" + fmt(nas17[i]) + c.unit);
    const note =
      (bySlugPresent
        ? "Rata-rata nasional " + fmtShort(dataDate ?? liveProvDate)
        : "Rata-rata nasional arsip 17 Nov 2026") +
      ": " +
      avgParts.join(" · ") +
      (bySlugPresent ? ". Minyakita: data 17 Nov 2026, perubahannya terhadap 16 Nov 2026." : ".");
    const missing: string[] = [];
    COMMS.forEach((c, i) => {
      provNames.forEach((name) => {
        if (prov[name][i * 2] === null) missing.push(name + " (" + c.name.toLowerCase() + ")");
      });
    });
    provNote = note + " Tanda “—” berarti provinsi belum melaporkan komoditas itu";
    provNote += missing.length > 0 ? ": " + missing.join(", ") + "." : ".";
    const fellBack: string[] = [];
    MAIN_SLUGS.forEach((slug, i) => {
      if (!commLive[i]) fellBack.push(COMMS[i].name.toLowerCase());
    });
    if (fellBack.length > 0)
      provNote +=
        " Data live " +
        fellBack.join(", ") +
        " tidak terjangkau saat halaman dimuat — komoditas itu memakai data arsip 17 Nov 2026.";
  }

  const rankChgHead = live
    ? "Perubahan vs " +
      fmtDayMon(prevISO(rankCi === 4 ? "2026-11-17" : liveProvDate))
    : "Perubahan vs 16 Nov";

  return (
    <section id="provinsi" aria-labelledby="h-provinsi">
      <div className="sec-head">
        <h2 id="h-provinsi">
          Harga per <span className="hl">Provinsi</span>
        </h2>
        <div className="sec-meta" id="provMeta">
          {live ? (
            <>
              SUMBER: <b>BAPANAS &amp; PIHPS VIA BAKSOSAPI.COM</b>
              <br />
              DATA {fmtShort(liveProvDate).toUpperCase()} · VS HARI SEBELUMNYA
            </>
          ) : (
            <>
              SUMBER: <b>PANEL HARGA PANGAN BAPANAS</b>
              <br />
              17 NOV 2026 · DIBANDING 16 NOV 2026
            </>
          )}
        </div>
      </div>
      <p className="sec-lede" id="provLede">
        {live ? (
          <>
            Harga rata-rata eceran tingkat konsumen untuk <strong>38 provinsi</strong> dan 5 komoditas
            utama. Beras medium, cabai rawit merah, bawang merah, dan telur ayam diambil{" "}
            <strong>live dari API baksosapi.com</strong> — cermin Panel Harga Pangan Bapanas dan PIHPS —
            setiap halaman dibuka; <strong>Minyakita tetap data 17 November 2026</strong> karena tidak
            tersedia di API itu. Pilih provinsi untuk melihat detail harganya, atau pakai peringkat di
            bawah untuk membandingkan satu komoditas antarprovinsi. Perubahan adalah selisih harga terbaru
            terhadap harga hari sebelumnya yang dilaporkan API untuk provinsi itu. Perhatian: angka live per
            provinsi mengikuti seri API baksosapi.com (skala PIHPS), bukan seri arsip Bapanas di halaman
            ini — selisih besar antara mode live dan mode arsip, misalnya pada beras medium, adalah
            pergantian seri sumber, bukan kenaikan harga dalam sehari.
          </>
        ) : (
          <>
            Harga rata-rata eceran tingkat konsumen untuk <strong>38 provinsi</strong> dan 5 komoditas
            utama, dari Panel Harga Pangan Bapanas. Pilih provinsi untuk melihat detail harganya, atau
            pakai peringkat di bawah untuk membandingkan satu komoditas antarprovinsi. Semua perubahan
            adalah selisih <strong>17 November terhadap 16 November 2026</strong>.
          </>
        )}
      </p>

      <div className="controls">
        <label className="select-box">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <select
            id="provSelect"
            aria-label="Pilih provinsi"
            value={selectedProv}
            onChange={(e) => setSelectedProv(e.target.value)}
          >
            {provNames.map((name) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel">
        <div className="prov-head">
          <h3 id="provName">{selectedProv}</h3>
          <span className="prov-head-note" id="provHeadNote">
            {live
              ? "DATA LIVE " + fmtShort(liveProvDate).toUpperCase() + " · PERUBAHAN VS HARI SEBELUMNYA"
              : "HARGA 17 NOV 2026 · PERUBAHAN VS 16 NOV 2026"}
          </span>
        </div>
        <table
          className="ptable"
          aria-label="Detail harga per komoditas untuk provinsi terpilih menurut Bapanas"
        >
          <thead>
            <tr>
              <th scope="col">Komoditas</th>
              <th scope="col" className="num">
                Harga (Rp)
              </th>
              <th scope="col" className="num" id="provChgHead">
                {live
                  ? "Perubahan vs " + fmtDayMon(prevISO(liveProvDate))
                  : "Perubahan vs 16 Nov"}
              </th>
              <th scope="col" className="num hide-sm">
                vs Rata-rata Nasional
              </th>
            </tr>
          </thead>
          <tbody id="provBody">{detailRows}</tbody>
        </table>
      </div>
      <p className="cmp-table-note" id="provNote">
        {provNote}
      </p>

      <h3 className="prov-sub" id="mvHead">
        {mvHead}
      </h3>
      <p className="prov-sub-note">
        Perubahan satu hari terbesar antarprovinsi, dihitung dari data Bapanas kedua tanggal tersebut.
      </p>
      <div className="hap-grid">
        <div className="hap-card">
          <h3>Kenaikan Terbesar</h3>
          <p className="hap-sub">Berdasarkan persen perubahan</p>
          <div id="mvUpRows">{mvUpContent}</div>
          <p className="mv-note" id="mvUpNote">
            {mvUpNote}
          </p>
        </div>
        <div className="hap-card">
          <h3>Penurunan Terbesar</h3>
          <p className="hap-sub" id="mvDownSub">
            {mvDownSub}
          </p>
          <div id="mvDownRows">{mvDownContent}</div>
          <p className="mv-note" id="mvDownNote">
            {mvDownNote}
          </p>
        </div>
      </div>

      <h3 className="prov-sub">Peringkat Harga antar Provinsi</h3>
      <p className="prov-sub-note" id="rankUnit">
        {live
          ? "Pilih komoditas — tabel mengurutkan provinsi dari harga tertinggi ke terendah pada " +
            fmtShort(liveProvDate) +
            ", lengkap dengan perubahannya terhadap hari sebelumnya. Provinsi yang belum melaporkan komoditas itu tampil di bagian bawah dengan tanda “—”. Minyakita memakai data 17 Nov 2026."
          : "Pilih komoditas — tabel mengurutkan 38 provinsi dari harga tertinggi ke terendah pada 17 Nov 2026, lengkap dengan perubahannya terhadap 16 Nov 2026."}
      </p>
      <div className="controls">
        <div className="chips" role="group" aria-label="Pilih komoditas untuk peringkat" id="rankChips">
          {COMMS.map((c, i) => (
            <button
              className="chip"
              type="button"
              data-ci={i}
              aria-pressed={rankCi === i ? "true" : "false"}
              key={c.name}
              onClick={() => setRankCi(i)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="panel">
        <table
          className="ptable rank-table"
          id="rankTable"
          aria-label={
            live
              ? "Peringkat harga komoditas per provinsi dari data live " +
                fmtDM(liveProvDate) +
                " " +
                dObj(liveProvDate).y
              : "Peringkat harga komoditas per provinsi menurut Bapanas 17 November 2026"
          }
        >
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Provinsi</th>
              <th scope="col" className="num" id="rankPriceHead">
                Harga (Rp{COMMS[rankCi].unit})
              </th>
              <th scope="col" className="num" id="rankChgHead">
                {rankChgHead}
              </th>
            </tr>
          </thead>
          <tbody id="rankBody">{rankRows}</tbody>
        </table>
      </div>

      <h3 className="prov-sub">Termurah &amp; Termahal per Komoditas</h3>
      <p className="prov-sub-note" id="extNote">
        {extNote}
      </p>
      <div className="panel">
        <table className="ptable" id="extTable" aria-label={extAriaLabel}>
          <thead>
            <tr>
              <th scope="col">Komoditas</th>
              <th scope="col">Termurah</th>
              <th scope="col">Termahal</th>
            </tr>
          </thead>
          <tbody id="extBody">{extRows}</tbody>
        </table>
      </div>
      <p className="cmp-table-note">
        Bapanas memperbarui data sepanjang hari, jadi angka per provinsi bisa berbeda dengan harga di pasar
        tertentu. Data kosong (“—”) berarti provinsi belum melaporkan komoditas tersebut.
      </p>
    </section>
  );
}
