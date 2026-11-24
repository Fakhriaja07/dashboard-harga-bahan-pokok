// Grafik batang horizontal: harga satu komoditas di semua provinsi,
// diurutkan termahal → termurah, dengan garis rata-rata nasional.
// SVG digambar manual (tanpa library chart) agar build tetap satu file.
import { fmt } from "../lib/format";

export interface ProvinceChartRow {
  name: string;
  price: number;
}

interface ProvinceChartProps {
  rows: ProvinceChartRow[];
  nationalAvg: number;
  unit: string;
  selectedProv: string;
}

const LABEL_W = 112;
const BAR_W = 428;
const VALUE_W = 88;
const W = LABEL_W + BAR_W + VALUE_W;
const ROW_H = 24;
const BAR_H = 14;

export default function ProvinceChart({
  rows,
  nationalAvg,
  unit,
  selectedProv,
}: ProvinceChartProps): React.JSX.Element {
  if (rows.length === 0) return <></>;
  const max = Math.max(...rows.map((r) => r.price), nationalAvg, 1);
  const H = rows.length * ROW_H + 8;
  const avgX = LABEL_W + (nationalAvg / max) * BAR_W;
  const barW = (v: number): number => Math.max(2, (v / max) * BAR_W);

  return (
    <div className="prov-chart">
      <div className="chart-legend">
        <span className="lg-line" aria-hidden="true"></span>
        Rata-rata nasional: Rp{fmt(nationalAvg)}
        {unit}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Grafik batang harga per provinsi, diurutkan dari termahal ke termurah"
      >
        <line
          x1={avgX}
          y1={0}
          x2={avgX}
          y2={H}
          stroke="#e4572e"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        {rows.map((r, i) => {
          const y = i * ROW_H + 4;
          const w = barW(r.price);
          const isSel = r.name === selectedProv;
          return (
            <g key={r.name}>
              <text x={LABEL_W - 8} y={y + 11} textAnchor="end" className="pc-label">
                {r.name}
              </text>
              <rect
                x={LABEL_W}
                y={y}
                width={w}
                height={BAR_H}
                rx={3}
                fill={isSel ? "#e4572e" : "#0c2d4d"}
              />
              <text x={LABEL_W + w + 7} y={y + 11} className="pc-value">
                Rp{fmt(r.price)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
