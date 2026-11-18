// Ticker harga berjalan (logika tickHTML pada skrip vanilla, sebagai JSX).
import type { Tick } from "../types";
import { fmt } from "../lib/format";

function TickChange({ t }: { t: Tick }): React.JSX.Element {
  if (t.chg === null) {
    return <span className="t-flat">Rp{fmt(t.price)}</span>;
  }
  if (t.chg > 0) {
    return (
      <span className="t-up">
        Rp{fmt(t.price)} ▲{fmt(t.chg)}
      </span>
    );
  }
  return (
    <span className="t-down">
      Rp{fmt(t.price)} ▼{fmt(Math.abs(t.chg))}
    </span>
  );
}

function TickSet({ ticks, hidden }: { ticks: Tick[]; hidden?: boolean }): React.JSX.Element {
  return (
    <div className="tick-set" aria-hidden={hidden ? true : undefined}>
      {ticks.map((t) => (
        <span className="tick" key={t.name}>
          <span className="t-name">{t.name}</span>
          <TickChange t={t} />
        </span>
      ))}
    </div>
  );
}

export default function Ticker({ ticks }: { ticks: Tick[] }): React.JSX.Element {
  return (
    <div className="ticker" aria-label="Harga pilihan hari ini menurut PIHPS">
      <div className="ticker-track" id="tickerTrack">
        <TickSet ticks={ticks} />
        <TickSet ticks={ticks} hidden />
      </div>
    </div>
  );
}
