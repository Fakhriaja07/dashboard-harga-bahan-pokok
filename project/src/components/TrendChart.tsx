// Panel grafik tren harga satu komoditas (data /history baksosapi.com).
// SVG digambar manual (tanpa library chart) agar build tetap satu file.
import type { HistoryPoint } from "../types";
import { fmtDayMon, fmtShort } from "../lib/dates";
import { fmt } from "../lib/format";

interface TrendChartProps {
  name: string;
  pts: HistoryPoint[] | null;
  loading: boolean;
  err: boolean;
  onClose: () => void;
}

const W = 720;
const H = 240;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOT = 10;

export default function TrendChart({
  name,
  pts,
  loading,
  err,
  onClose,
}: TrendChartProps): React.JSX.Element {
  let body: React.JSX.Element;
  if (loading) {
    body = <div className="empty-msg">Memuat riwayat harga…</div>;
  } else if (err || !pts || pts.length < 2) {
    body = <div className="empty-msg">Riwayat harga tidak tersedia untuk komoditas ini.</div>;
  } else {
    const prices = pts.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = pts[0];
    const last = pts[pts.length - 1];
    const range = max - min;
    const pad = range > 0 ? range * 0.08 : Math.max(1, max * 0.01);
    const lo = min - pad;
    const hi = max + pad;
    const x = (i: number): number => PAD_X + (i / (pts.length - 1)) * (W - PAD_X * 2);
    const y = (v: number): number => PAD_TOP + (1 - (v - lo) / (hi - lo)) * (H - PAD_TOP - PAD_BOT);
    const line = pts.map((p, i) => x(i).toFixed(1) + "," + y(p.price).toFixed(1)).join(" ");
    const area =
      "M" +
      x(0).toFixed(1) +
      "," +
      (H - PAD_BOT) +
      " L" +
      pts.map((p, i) => x(i).toFixed(1) + "," + y(p.price).toFixed(1)).join(" L") +
      " L" +
      x(pts.length - 1).toFixed(1) +
      "," +
      (H - PAD_BOT) +
      " Z";
    const chgAbs = last.price - first.price;
    const chgPct = first.price !== 0 ? (chgAbs / first.price) * 100 : 0;
    const chgCls = chgAbs > 0 ? "chg up" : chgAbs < 0 ? "chg down" : "chg flat";
    const chgTxt =
      chgAbs === 0
        ? "0 (0,00%)"
        : (chgAbs > 0 ? "▲ +" : "▼ −") +
          fmt(Math.abs(chgAbs)) +
          " (" +
          (chgAbs > 0 ? "+" : "−") +
          Math.abs(chgPct).toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) +
          "%)";
    body = (
      <>
        <div className="trendstats">
          <div className="tstat">
            <span className="tstat-label">Terendah</span>
            <span className="tstat-val">Rp{fmt(min)}</span>
          </div>
          <div className="tstat">
            <span className="tstat-label">Tertinggi</span>
            <span className="tstat-val">Rp{fmt(max)}</span>
          </div>
          <div className="tstat">
            <span className="tstat-label">Terakhir ({fmtDayMon(last.date)})</span>
            <span className="tstat-val">Rp{fmt(last.price)}</span>
          </div>
          <div className="tstat">
            <span className="tstat-label">Perubahan periode</span>
            <span className={chgCls}>{chgTxt}</span>
          </div>
        </div>
        <svg
          className="trend-svg"
          viewBox={"0 0 " + W + " " + H}
          role="img"
          aria-label={
            "Grafik tren harga " +
            name +
            " dari " +
            fmtShort(first.date) +
            " sampai " +
            fmtShort(last.date)
          }
        >
          <line className="trend-grid" x1={PAD_X} x2={W - PAD_X} y1={y(max)} y2={y(max)} />
          <line className="trend-grid" x1={PAD_X} x2={W - PAD_X} y1={y(min)} y2={y(min)} />
          <path className="trend-area" d={area} />
          <polyline className="trend-line" points={line} />
          <circle className="trend-dot" cx={x(0)} cy={y(first.price)} r="4" />
          <circle className="trend-dot" cx={x(pts.length - 1)} cy={y(last.price)} r="4" />
        </svg>
        <div className="trend-axis">
          <span>{fmtShort(first.date)}</span>
          <span>{fmtShort(last.date)}</span>
        </div>
      </>
    );
  }

  return (
    <div className="panel trendpanel" aria-live="polite">
      <div className="trendhead">
        <h3>
          Tren Harga — <span className="hl">{name}</span>
        </h3>
        <button className="datebtn" type="button" onClick={onClose}>
          Tutup
        </button>
      </div>
      <p className="trend-sub">
        Riwayat harga nasional dari API baksosapi.com (cermin PIHPS &amp; Bapanas).
      </p>
      {body}
    </div>
  );
}
