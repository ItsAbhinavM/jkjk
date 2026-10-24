import { useEffect, useState } from "react";
import { simulateProcurement } from "../services/api";
import type { DateRange, ProcurementRow } from "../types";

interface Result {
  key: string; // the request these rows answer
  rows: ProcurementRow[];
  error: string | null;
}

/** Runs the procurement simulation whenever the dates, demand or confidence level change. */
export function useProcurement(range: DateRange, demand: number, confidence: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${range.join("_")}|${demand}|${confidence}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    simulateProcurement(
      { demand_mw: demand, confidence_level: confidence, start_date: range[0], end_date: range[1] },
      controller.signal
    )
      .then((rows) => setResult({ key, rows, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key, rows: [], error: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, [key, range, demand, confidence]);

  return {
    rows: result?.rows ?? [],
    error: result?.error ?? null,
    loading: result?.key !== key,
    retry: () => setAttempt((n) => n + 1),
  };
}