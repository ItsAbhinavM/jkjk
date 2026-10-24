import { useEffect, useState } from "react";
import { getMetrics, getSeries } from "../services/api";
import type { DataPoint, DateRange, Metrics } from "../types";

export const FULL_RANGE: DateRange = ["2026-01-01", "2026-01-31"];

interface Result {
  range: DateRange; // the range these results belong to
  data: DataPoint[];
  metrics: Metrics | null;
  error: string | null;
}

/** Loads the half-hourly series and accuracy metrics for the selected date range. */
export function useElexonData() {
  const [dateRange, setDateRange] = useState<DateRange>(FULL_RANGE);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const [start, end] = dateRange;

    Promise.all([getSeries(start, end, controller.signal), getMetrics(start, end, controller.signal)])
      .then(([series, metrics]) => {
        // Timestamps carry a "Z", so Date parses them as UTC.
        const data = series.map((d) => ({ ...d, time: new Date(d.start_time) }));
        setResult({ range: dateRange, data, metrics, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ range: dateRange, data: [], metrics: null, error: err instanceof Error ? err.message : String(err) });
      });

    return () => controller.abort();
  }, [dateRange]);

  // Loading until a result for the current range arrives; the previous result stays visible meanwhile.
  const loading = result?.range !== dateRange;

  return {
    data: result?.data ?? [],
    metrics: result?.metrics ?? null,
    loading,
    error: result?.error ?? null,
    dateRange,
    /** The range the data on screen belongs to (differs from dateRange while loading). */
    dataRange: result?.range ?? dateRange,
    setDateRange,
  };
}