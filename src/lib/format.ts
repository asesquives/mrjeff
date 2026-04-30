// Lima timezone helpers (UTC-5, no DST).

const LIMA_OFFSET = "-05:00";

/** Number with thousands comma. */
export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

/** Soles with thousands comma + 2 decimals. */
export const formatCurrency = (n: number) =>
  `S/ ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)}`;

/** Returns ISO with Lima offset (no actual conversion of the wall-clock date passed). */
export const limaIso = (year: number, month1to12: number, day: number, h = 0, m = 0, s = 0) => {
  const mm = String(month1to12).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(h).padStart(2, "0");
  const mi = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:${mi}:${ss}${LIMA_OFFSET}`;
};

/** Convert a UTC Date to the corresponding Lima wall-clock parts. */
const limaParts = (d: Date) => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => Number(fmt.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute"), ss: get("second") };
};

export const startOfTodayLima = () => {
  const { y, m, d } = limaParts(new Date());
  return limaIso(y, m, d, 0, 0, 0);
};
export const endOfTodayLima = () => {
  const { y, m, d } = limaParts(new Date());
  return limaIso(y, m, d, 23, 59, 59);
};

export const startOfMonthLima = (offsetMonths = 0) => {
  const { y, m } = limaParts(new Date());
  const total = (y * 12 + (m - 1)) + offsetMonths;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return limaIso(ny, nm, 1, 0, 0, 0);
};

/** Start of the month N months ago (0 = current). */
export const startOfMonthOffset = (offsetMonthsAgo: number) => startOfMonthLima(-offsetMonthsAgo);

export const monthLabel = (offsetMonthsAgo: number) => {
  const { y, m } = limaParts(new Date());
  const total = (y * 12 + (m - 1)) - offsetMonthsAgo;
  const ny = Math.floor(total / 12);
  const nm = (total % 12);
  return new Date(ny, nm, 1).toLocaleString("es-PE", { month: "short" });
};
