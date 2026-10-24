/** One half-hour of POST /api/v1/procurement/simulate. */
export interface ProcurementRow {
    start_time: string;
    forecast_wind: number | null;
    demand: number;
    raw_deficit: number | null; // demand - forecast
    recommended_procurement: number | null; // max(0, deficit + buffer)
    risk_buffer_mw: number;
  }
  
  export interface SimulateRequest {
    demand_mw: number;
    confidence_level: number; // 0.5 - 0.99
    start_date: string;
    end_date: string;
  }
  
/** One half-hour slot as returned by GET /api/v1/data/series. null = no data (never 0). */
export interface SeriesPoint {
    start_time: string; // ISO 8601 UTC, e.g. "2026-01-01T00:00:00Z"
    settlement_period: number;
    actual_mw: number | null;
    forecast_mw: number | null;
    error_mw: number | null; // forecast - actual
  }
  
  /** A series point with its timestamp parsed into a Date. */
  export interface DataPoint extends SeriesPoint {
    time: Date;
  }
  
  /** GET /api/v1/analytics/metrics */
  export interface Metrics {
    mae: number | null;
    rmse: number | null;
    mape: number | null;
    bias: number | null; // > 0: wind over-forecast on average
    count: number;
    p10: number | null;
    p50: number | null;
    p90: number | null;
    error_distribution: number[];
  }
  
  /** One point of the forecast uncertainty band. */
  export interface BandPoint {
    time: Date;
    forecast: number | null;
    actual: number | null;
    lower: number | null;
    upper: number | null;
  }
  
  export type DateRange = [start: string, end: string]; // "YYYY-MM-DD"