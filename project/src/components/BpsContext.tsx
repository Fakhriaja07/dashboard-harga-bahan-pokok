// Section Konteks Inflasi dari BPS (statis; markup sama dengan index.html vanilla).
export default function BpsContext(): React.JSX.Element {
  return (
    <section id="konteks" aria-labelledby="h-konteks">
      <div className="sec-head">
        <h2 id="h-konteks">
          Konteks Inflasi <span className="hl">dari BPS</span>
        </h2>
        <div className="sec-meta">
          SUMBER: <b>BPS</b>
          <br />
          OKT 2026 &amp; PEKAN KE-3 NOV 2026
        </div>
      </div>

      <div className="hap-grid">
        <div className="hap-card">
          <h3>Cabai vs Harga Acuan (HAP)</h3>
          <p className="hap-sub">Rata-rata nasional BPS, pekan ke-3 Nov 2026 · Rp/kg</p>
          <div className="bar-row">
            <div className="bar-label">
              <span className="bl-name">Cabai merah — rata-rata nasional</span>
              <span className="bl-val">Rp73.319</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill over" style={{ width: "100%" }}></div>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">
              <span className="bl-name">Batas atas HAP cabai merah</span>
              <span className="bl-val">Rp55.000</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill hap" style={{ width: "75.0%" }}></div>
            </div>
            <div className="over-note">Rata-rata nasional Rp18.319 di atas batas atas HAP</div>
          </div>
          <div className="bar-row" style={{ marginTop: "22px" }}>
            <div className="bar-label">
              <span className="bl-name">Cabai rawit — rata-rata nasional</span>
              <span className="bl-val">Rp83.823</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill over" style={{ width: "100%" }}></div>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">
              <span className="bl-name">Batas atas HAP cabai rawit</span>
              <span className="bl-val">Rp57.000</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill hap" style={{ width: "68.0%" }}></div>
            </div>
            <div className="over-note">Rata-rata nasional Rp26.823 di atas batas atas HAP</div>
          </div>
        </div>

        <div className="hap-card">
          <h3>Angka kunci lainnya</h3>
          <p className="hap-sub">Dari Rakor Pengendalian Inflasi Daerah, 23 Nov 2026</p>
          <div className="stable-list" style={{ gridTemplateColumns: "1fr" }}>
            <div className="stable-item">
              Beras medium — rata-rata nasional Rp14.670/kg <span>BPS, pekan ke-3 Nov 2026</span>
            </div>
            <div className="stable-item">
              Beras premium — rata-rata nasional Rp16.548/kg <span>BPS, pekan ke-3 Nov 2026</span>
            </div>
            <div className="stable-item">
              Inflasi cabai rawit 104,35% (y-on-y) <span>Melonjak dari 64,16% pada September 2026</span>
            </div>
            <div className="stable-item">
              “Stabil tinggi” menurut BPS <span>Beras · minyak goreng · cabai merah · cabai rawit</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
