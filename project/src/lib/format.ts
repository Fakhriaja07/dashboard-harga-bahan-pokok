// Helper format & sanitasi (dipindah dari main.ts vanilla, tanpa perubahan).
export function fmt(n: number): string {
  return n.toLocaleString("id-ID");
}

/* Sanitasi data API (sumber pihak ketiga): angka harus benar-benar
   numerik dan tanggal harus berformat ISO, selain itu dibuang. */
export function numOrNull(v: unknown): number | null {
  const n: number = Number(v);
  return isFinite(n) ? n : null;
}

export function validDate(v: unknown): string | null {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Narrowing untuk JSON mentah: objek biasa (bukan array, bukan null). */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return names[0] + " & " + names[1];
  return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
}

/** Jam halaman dimuat (WIB); bila Intl gagal, kembalikan nilai snapshot. */
export function loadTimeWIB(): string {
  try {
    const t = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    return t + " WIB";
  } catch {
    return "19.37 WIB";
  }
}
