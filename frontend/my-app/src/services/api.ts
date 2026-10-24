import type { Metrics, SeriesPoint } from "../types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, { signal });
  if (!res.ok) {
    const body: { detail?: unknown } | null = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const dates = (start: string, end: string) => new URLSearchParams({ start_date: start, end_date: end });

export const getSeries = (start: string, end: string, signal?: AbortSignal) =>
  request<SeriesPoint[]>(`/data/series?${dates(start, end)}`, signal);

export const getMetrics = (start: string, end: string, signal?: AbortSignal) =>
  request<Metrics>(`/analytics/metrics?${dates(start, end)}`, signal);