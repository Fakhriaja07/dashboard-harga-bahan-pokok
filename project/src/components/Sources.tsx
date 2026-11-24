// Footer + daftar Sumber Data (markup sama persis dengan index.html vanilla;
// hanya status footer yang mengikuti mode live/arsip seperti finalize()).
export default function Sources({ footStatus }: { footStatus: string }): React.JSX.Element {
  return (
    <footer id="sumber">
      <div className="wrap">
        <h3>Sumber Data</h3>
        <ul className="src-list">
          <li>
            <b>PIHPS Nasional (Bank Indonesia)</b> — hargapangan.id; dikutip via koncodewe.com &amp;
            newshive.id, 17 Nov 2026.
          </li>
          <li>
            <b>BPS</b> — dikutip via lampungprov.go.id, validnews.id &amp; chatnews.id, 23 Nov 2026;
            Rakor Pengendalian Inflasi Daerah 23 Nov 2026.
          </li>
          <li>
            <b>Panel Harga Pangan Bapanas</b> — dikutip via journalarta.com, 17 Nov 2026; termasuk data per
            provinsi (38 provinsi, 5 komoditas, 17 Nov dibanding 16 Nov 2026) untuk section Harga per
            Provinsi.
          </li>
          <li>
            <b>baksosapi.com (API live)</b> — situs pihak ketiga yang mengumpulkan data PIHPS Bank
            Indonesia dan Panel Harga Pangan Bapanas; bukan situs resmi kedua lembaga itu. Harga nasional
            dan harga per provinsi diambil dari API ini setiap halaman dibuka (diperbarui ±06.00 &amp;
            10.00 WIB). Minyakita tidak tersedia di API ini.
          </li>
        </ul>
        <div className="foot-line">
          <span>© 2026 Fakhri — Data Analyst</span>
          <span className="mono" id="footStatus">
            {footStatus}
          </span>
        </div>
      </div>
    </footer>
  );
}
