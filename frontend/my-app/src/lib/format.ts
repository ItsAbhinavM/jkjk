import { utcFormat, utcParse } from "d3";

const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export const fmtMW = (v: number | null) => (v == null ? "—" : nf.format(v));
export const fmtSigned = (v: number | null) => (v == null ? "—" : `${v > 0 ? "+" : ""}${nf.format(v)}`);
export const fmtPct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);
export const fmtDateTime = utcFormat("%a %-d %b %H:%M UTC");

const parseDay = utcParse("%Y-%m-%d");
const dayLong = utcFormat("%-d %b %Y");
const dayShort = utcFormat("%a %-d %b");

/** "2026-01-05" -> "5 Jan 2026" */
export const fmtDay = (iso: string) => {
  const d = parseDay(iso);
  return d ? dayLong(d) : iso;
};

/** "2026-01-05" -> "Mon 5 Jan" */
export const fmtDayShort = (iso: string) => {
  const d = parseDay(iso);
  return d ? dayShort(d) : iso;
};