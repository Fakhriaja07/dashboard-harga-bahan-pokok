// Strip indikator inflasi BPS (statis; markup sama dengan index.html vanilla).
export default function Indicators(): React.JSX.Element {
  return (
    <div className="wrap indicators">
      <div className="ind-strip" role="list" aria-label="Indikator inflasi BPS Oktober 2026">
        <div className="ind" role="listitem">
          <div className="label">Inflasi umum</div>
          <div className="value">
            3,23<small>%</small>
          </div>
          <div className="note">Year-on-year, Oktober 2026</div>
          <div className="src">SUMBER: BPS</div>
        </div>
        <div className="ind" role="listitem">
          <div className="label">Inflasi pangan bergejolak</div>
          <div className="value">
            5,81<small>%</small>
          </div>
          <div className="note">Volatile food, year-on-year</div>
          <div className="src">SUMBER: BPS · OKT 2026</div>
        </div>
        <div className="ind" role="listitem">
          <div className="label">Inflasi inti</div>
          <div className="value">
            2,56<small>%</small>
          </div>
          <div className="note">Year-on-year, Oktober 2026</div>
          <div className="src">SUMBER: BPS</div>
        </div>
        <div className="ind hot" role="listitem">
          <div className="label">Inflasi cabai rawit</div>
          <div className="value">
            104,35<small>%</small>
          </div>
          <div className="note">Naik dari 64,16% pada September 2026</div>
          <div className="src">SUMBER: BPS · OKT 2026</div>
        </div>
      </div>
    </div>
  );
}
