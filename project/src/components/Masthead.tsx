// Masthead: topbar + judul + kotak Pembaruan Terakhir + ticker.
// Markup dan class SAMA dengan index.html vanilla; nilai update-box
// diturunkan dari state live (lihat finalize() pada skrip vanilla).
// Ticker dirender di dalam <header> seperti vanilla (bukan di App) supaya
// border bawah header tetap jatuh di bawah ticker.
import { dObj, fmtDM, fmtLong } from "../lib/dates";
import type { Tick } from "../types";
import Ticker from "./Ticker";

interface MastheadProps {
  finalized: boolean;
  liveAny: boolean;
  dataDate: string | null;
  ubTime: string;
  ticks: Tick[];
}

export function BrandMark(): React.JSX.Element {
  return (
    <svg viewBox="0 0 64 64" focusable="false">
      <defs>
        <clipPath id="brandGlobe">
          <circle cx="26" cy="26" r="20" />
        </clipPath>
      </defs>
      <circle cx="26" cy="26" r="20" fill="var(--navy)" />
      <g clipPath="url(#brandGlobe)" fill="none" stroke="var(--paper)" strokeWidth="3.4">
        <ellipse cx="26" cy="26" rx="10" ry="20" />
        <path d="M4 18h44M4 34h44" />
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 29h6l3 17h17l3-12H37" stroke="var(--paper)" strokeWidth="8.5" />
        <path d="M30 29h6l3 17h17l3-12H37" stroke="var(--accent)" strokeWidth="4.4" />
      </g>
      <circle cx="43" cy="52" r="4" fill="var(--paper)" />
      <circle cx="43" cy="52" r="2.6" fill="var(--accent)" />
      <circle cx="54" cy="52" r="4" fill="var(--paper)" />
      <circle cx="54" cy="52" r="2.6" fill="var(--accent)" />
    </svg>
  );
}

export default function Masthead({
  finalized,
  liveAny,
  dataDate,
  ubTime,
  ticks,
}: MastheadProps): React.JSX.Element {
  const badgeClass = !finalized
    ? "live-badge"
    : liveAny
      ? "live-badge is-live"
      : "live-badge is-arsip";
  const badgeText = !finalized ? "Memuat…" : liveAny ? "LIVE" : "ARSIP";
  const ubDate = finalized && liveAny && dataDate ? fmtLong(dataDate) : "Selasa, 17 Nov 2026";
  const ubSource = finalized && liveAny ? "baksosapi.com · PIHPS & Bapanas" : "3 lembaga resmi";
  const topStatus = !finalized ? (
    <>
      Snapshot data · <b>16–17 November 2026</b>
    </>
  ) : liveAny && dataDate ? (
    <>
      Data live · <b>{fmtDM(dataDate) + " " + dObj(dataDate).y}</b>
    </>
  ) : liveAny ? (
    <>
      Snapshot data · <b>16–17 November 2026</b>
    </>
  ) : (
    <>
      Mode arsip · <b>data 17 November 2026</b>
    </>
  );

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>PIHPS · BPS · Bapanas</span>
          <span id="topStatus">{topStatus}</span>
        </div>
      </div>

      <header className="masthead">
        <div className="wrap">
          <div className="mast-grid">
            <div>
              <div className="mast-title">
                <span className="brand-mark" aria-hidden="true">
                  <BrandMark />
                </span>
                <div>
                  <div className="mast-kicker">Buletin Harga Pangan</div>
                  <h1>
                    Harga Bahan Pokok
                    <br />
                    <span className="hl">Indonesia</span>
                  </h1>
                </div>
              </div>
              <p className="mast-lede">
                Berapa harga beras, cabai, dan telur hari ini — di pasar nasional dan di setiap provinsi di
                Indonesia.
              </p>
            </div>
            <aside className="update-box" aria-label="Keterangan pembaruan data">
              <div className="ub-head">
                Pembaruan Terakhir{" "}
                <span className={badgeClass} id="liveBadge">
                  <span className="dot"></span>
                  {badgeText}
                </span>
              </div>
              <dl>
                <div className="ub-row">
                  <dt>Tanggal data</dt>
                  <dd id="ubDate">{ubDate}</dd>
                </div>
                <div className="ub-row">
                  <dt>Halaman dimuat</dt>
                  <dd id="ubTime">{ubTime}</dd>
                </div>
                <div className="ub-row">
                  <dt>Cakupan</dt>
                  <dd id="ubCoverage">Nasional · 38 Provinsi</dd>
                </div>
                <div className="ub-row">
                  <dt>Sumber</dt>
                  <dd id="ubSource">{ubSource}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
        <Ticker ticks={ticks} />
      </header>
    </>
  );
}
