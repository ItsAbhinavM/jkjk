import { useMemo } from "react";
import type { BandPoint, DataPoint, Metrics } from "../types";

/**
 * Turns the error quantiles into a likely range for actual output.
 * Error E = F - A, so A is between F - P90 and F - P10 about 80% of the time.
 */
export function computeBand(data: DataPoint[], metrics: Metrics | null): { bandData: BandPoint[]; coverage: number | null } {
  if (!metrics || metrics.count === 0 || metrics.p10 == null || metrics.p90 == null) {
    return { bandData: [], coverage: null };
  }

  const { p10, p90 } = metrics;
  const bandData: BandPoint[] = data.map((d) => {
    const f = d.forecast_mw;
    return {
      time: d.time,
      forecast: f,
      actual: d.actual_mw,
      lower: f == null ? null : Math.max(0, f - p90),
      upper: f == null ? null : f - p10,
    };
  });

  const checked = bandData.filter((d) => d.forecast != null && d.actual != null);
  const inside = checked.filter((d) => d.actual! >= d.lower! && d.actual! <= d.upper!).length;
  return { bandData, coverage: checked.length ? inside / checked.length : null };
}

export function useAnalytics(data: DataPoint[], metrics: Metrics | null) {
  return useMemo(() => computeBand(data, metrics), [data, metrics]);
}