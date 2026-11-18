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
            <b>BPS</b> — dikutip via kowantaranews.com &amp; suaragarut.id, 16 Nov 2026; Rakor Pengendalian
            Inflasi Daerah 16 Nov 2026.
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
        <div className="caveat">
          <b>Catatan metodologi:</b> angka PIHPS, BPS, dan Bapanas bisa berbeda untuk komoditas yang sama
          karena periode dan cakupan pencatatannya berbeda. Karena itu setiap tabel di halaman ini berdiri
          sendiri dengan label sumber dan tanggalnya. Harga nasional dan harga per provinsi kini diambil
          live dari API baksosapi.com setiap halaman dibuka — baksosapi.com adalah cermin pihak ketiga
          atas data PIHPS dan Bapanas, bukan sumber resminya. Jika API tidak terjangkau, halaman otomatis
          menampilkan data arsip (snapshot) 16–17 November 2026 yang tetap tertanam di halaman ini, dan
          menandainya sebagai mode arsip. Minyakita dan indikator inflasi BPS tetap snapshot bertanggal
          sesuai labelnya. Halaman ini tidak menampilkan grafik tren harian. Pada section Harga per
          Provinsi, sel bertanda “—” berarti provinsi belum melaporkan komoditas itu pada tanggal datanya.
        </div>
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
