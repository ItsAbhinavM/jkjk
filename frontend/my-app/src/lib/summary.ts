import type { DataPoint } from "../types";

export const BIAS_THRESHOLD_MW = 200;

export interface Extreme {
  value: number;
  time: Date;
}

export interface ErrorSummary {
  overShare: number | null; // share of compared half-hours where forecast > actual
  underShare: number | null;
  maxOver: Extreme | null; // biggest single over-forecast
  maxUnder: Extreme | null; // biggest single under-forecast (negative)
}

/** Simple counts and extremes over the half-hours that have both an actual and a forecast. */
export function summariseErrors(data: DataPoint[]): ErrorSummary {
  let compared = 0;
  let over = 0;
  let under = 0;
  let maxOver: Extreme | null = null;
  let maxUnder: Extreme | null = null;

  for (const d of data) {
    const e = d.error_mw;
    if (e == null) continue;
    compared++;
    if (e > 0) {
      over++;
      if (!maxOver || e > maxOver.value) maxOver = { value: e, time: d.time };
    } else if (e < 0) {
      under++;
      if (!maxUnder || e < maxUnder.value) maxUnder = { value: e, time: d.time };
    }
  }

  return {
    overShare: compared ? over / compared : null,
    underShare: compared ? under / compared : null,
    maxOver,
    maxUnder,
  };
}

export type BiasTone = "bad" | "good" | "info";

export function biasVerdict(bias: number | null): { label: string; tone: BiasTone } | null {
  if (bias == null) return null;
  if (bias > BIAS_THRESHOLD_MW) return { label: "Systematic over-forecast", tone: "bad" };
  if (bias < -BIAS_THRESHOLD_MW) return { label: "Systematic under-forecast", tone: "info" };
  return { label: "Balanced", tone: "good" };
}