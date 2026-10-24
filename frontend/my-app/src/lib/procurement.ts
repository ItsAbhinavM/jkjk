import type { DataPoint, ProcurementRow } from "../types";

export const DEMAND_MIN = 5_000;
export const DEMAND_MAX = 25_000;
export const DEMAND_DEFAULT = 12_000;
export const CONFIDENCE_LEVELS = [0.8, 0.9, 0.95] as const;

export interface SlotAverage {
  slot: number; // 0-47, half-hours since 00:00 UTC
  mw: number; // mean procurement at that time of day across the selected days
}

export interface ProcurementSummary {
  buffer: number;
  profile: SlotAverage[];
  peak: SlotAverage | null; // time of day with the highest average procurement
  worstMw: number; // single largest half-hour
  needShare: number | null; // share of half-hours needing any thermal
  surplusShare: number | null; // share of half-hours where forecast wind alone exceeds demand
  maxSurplusMw: number;
  totalMwh: number;
  missing: number; // half-hours with no forecast
}

export const slotLabel = (slot: number) =>
  `${String(Math.floor(slot / 2)).padStart(2, "0")}:${slot % 2 ? "30" : "00"}`;

export function summariseProcurement(rows: ProcurementRow[]): ProcurementSummary {
  const sums = new Array<number>(48).fill(0);
  const counts = new Array<number>(48).fill(0);
  let worstMw = 0;
  let need = 0;
  let surplus = 0;
  let maxSurplusMw = 0;
  let total = 0;
  let known = 0;

  for (const r of rows) {
    if (r.recommended_procurement == null || r.raw_deficit == null) continue;
    known++;
    const slot = Number(r.start_time.slice(11, 13)) * 2 + (r.start_time.slice(14, 16) === "30" ? 1 : 0);
    sums[slot] += r.recommended_procurement;
    counts[slot]++;
    total += r.recommended_procurement;
    worstMw = Math.max(worstMw, r.recommended_procurement);
    if (r.recommended_procurement > 0) need++;
    if (r.raw_deficit < 0) {
      surplus++;
      maxSurplusMw = Math.max(maxSurplusMw, -r.raw_deficit);
    }
  }

  const profile = sums.map((s, slot) => ({ slot, mw: counts[slot] ? s / counts[slot] : 0 }));
  const peak = known ? profile.reduce((a, b) => (b.mw > a.mw ? b : a)) : null;

  return {
    buffer: rows[0]?.risk_buffer_mw ?? 0,
    profile,
    peak,
    worstMw,
    needShare: known ? need / known : null,
    surplusShare: known ? surplus / known : null,
    maxSurplusMw,
    totalMwh: total / 2, // MW over half an hour
    missing: rows.length - known,
  };
}

/** Back-test: in how many past half-hours was the forecast error within the buffer (the buffer would have been enough)? */
export function bufferCoverage(data: DataPoint[], buffer: number): number | null {
  const errors = data.filter((d) => d.error_mw != null);
  return errors.length ? errors.filter((d) => d.error_mw! <= buffer).length / errors.length : null;
}