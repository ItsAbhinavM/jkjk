import { useEffect, useMemo, useState } from "react";
import { Download, TriangleAlert } from "lucide-react";
import { useProcurement } from "../../hooks/useProcurement";
import { downloadRows } from "../../lib/csv";
import { fmtMW, fmtPct } from "../../lib/format";
import {
  bufferCoverage,
  CONFIDENCE_LEVELS,
  DEMAND_DEFAULT,
  DEMAND_MAX,
  DEMAND_MIN,
  slotLabel,
  summariseProcurement,
} from "../../lib/procurement";
import { BIAS_THRESHOLD_MW } from "../../lib/summary";
import { cn } from "../../lib/cn";
import type { DataPoint, DateRange, Metrics } from "../../types";
import Button from "../common/Button";
import Card from "../common/Card";
import MetricBadge from "../common/MetricBadge";
import ProcurementProfileChart from "../charts/ProcurementProfileChart";

interface ProcurementPanelProps {
  range: DateRange;
  data: DataPoint[];
  metrics: Metrics;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const EVENING = [16, 21]; // UTC hours treated as the evening peak

export default function ProcurementPanel({ range, data, metrics }: ProcurementPanelProps) {
  const [demand, setDemand] = useState(DEMAND_DEFAULT);
  const [appliedDemand, setAppliedDemand] = useState(DEMAND_DEFAULT);
  const [confidence, setConfidence] = useState<number>(0.9);

  // Wait for the slider to settle before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedDemand(demand), 250);
    return () => clearTimeout(timer);
  }, [demand]);

  const { rows, error, loading, retry } = useProcurement(range, appliedDemand, confidence);
  const summary = useMemo(() => summariseProcurement(rows), [rows]);
  const coverage = useMemo(() => bufferCoverage(data, summary.buffer), [data, summary.buffer]);
  const { peak } = summary;
  const hasRows = rows.length > 0 && peak != null;

  const peakHour = peak ? Math.floor(peak.slot / 2) : 0;
  const evening = peakHour >= EVENING[0] && peakHour < EVENING[1];
  const recommendation = !hasRows
    ? ""
    : peak.mw > 0
      ? `Procure ${fmtMW(peak.mw)} MW of thermal around ${slotLabel(peak.slot)} UTC${evening ? " (evening peak)" : ""} to achieve ${pct(confidence)} deficit coverage.`
      : `No thermal top-up needed: forecast wind plus the safety buffer covers ${fmtMW(appliedDemand)} MW of demand in every half-hour.`;

  const exportSheet = () =>
    downloadRows(
      `trading-sheet_${range[0]}_to_${range[1]}_${appliedDemand}MW_${Math.round(confidence * 100)}pct.csv`,
      ["start_time_utc", "forecast_wind_mw", "demand_mw", "raw_deficit_mw", "risk_buffer_mw", "recommended_procurement_mw"],
      rows.map((r) => [r.start_time, r.forecast_wind, r.demand, r.raw_deficit, r.risk_buffer_mw, r.recommended_procurement])
    );

  const biased = metrics.bias != null && metrics.bias > BIAS_THRESHOLD_MW;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-5" title="Your assumptions" description="The recommendation updates as you change these.">
          <div className="space-y-5">
            <label className="block">
              <span className="flex items-baseline justify-between text-sm font-medium text-slate-600">
                Demand to cover
                <span className="font-display text-3xl font-semibold text-slate-900">
                  {fmtMW(demand)} <span className="text-sm font-normal text-slate-500">MW</span>
                </span>
              </span>
              <input
                type="range"
                min={DEMAND_MIN}
                max={DEMAND_MAX}
                step={500}
                value={demand}
                onChange={(e) => setDemand(Number(e.target.value))}
                className="mt-2 w-full accent-violet-600"
              />
              <span className="flex justify-between text-xs text-slate-500">
                <span>{fmtMW(DEMAND_MIN)}</span>
                <span>{fmtMW(DEMAND_MAX)}</span>
              </span>
            </label>

            <div role="group" aria-label="Confidence level">
              <p className="mb-2 text-sm font-medium text-slate-600">How sure do you need to be?</p>
              <div className="flex flex-wrap gap-2">
                {CONFIDENCE_LEVELS.map((level) => (
                  <Button key={level} active={confidence === level} onClick={() => setConfidence(level)}>
                    {pct(level)}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                At {pct(confidence)}, the buffer is sized so that past forecast misses would have been covered in {pct(confidence)} of half-hours.
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={cn("lg:col-span-7", loading && "opacity-60")}
          accent="red"
          title="Recommendation"
          action={
            <Button variant="primary" onClick={exportSheet} disabled={!hasRows}>
              <Download size={16} aria-hidden />
              Export trading sheet
            </Button>
          }
        >
          {error ? (
            <div role="alert" className="space-y-3">
              <p className="text-amber-800">Couldn't calculate: {error}</p>
              <Button onClick={retry}>Try again</Button>
            </div>
          ) : hasRows ? (
            <>
              <p aria-live="polite" className="font-display text-4xl font-semibold leading-[1.05]">
                {recommendation}
              </p>
              <p className="mt-4 text-slate-600">
                This is the average for that half-hour across the selected days. The single largest top-up in the period is{" "}
                {fmtMW(summary.worstMw)} MW.
              </p>
            </>
          ) : (
            <p className="text-slate-600">{loading ? "Calculating…" : "There are no forecast half-hours in these dates to plan from."}</p>
          )}
        </Card>
      </div>

      {biased && (
        <div role="alert" className="flex gap-3 rounded-3xl bg-amber-100 px-6 py-4 text-amber-900">
          <TriangleAlert className="mt-0.5 shrink-0" size={20} aria-hidden />
          <p>
            In these dates the forecast ran {fmtMW(metrics.bias)} MW too high on average. Buying only what the raw forecast suggests
            would leave you short, so keep the safety buffer in.
          </p>
        </div>
      )}

      {hasRows && (
        <div className={cn("space-y-5", loading && "opacity-60")}>
          <div className="grid gap-5 lg:grid-cols-12">
            <Card
              className="lg:col-span-8"
              title="Thermal top-up through the day"
              description="Average MW to buy for each half-hour of the day. The red bar is the slot to plan around."
            >
              <ProcurementProfileChart profile={summary.profile} peakSlot={peak.mw > 0 ? peak.slot : null} height={300} />
            </Card>
            <div className="grid gap-5 lg:col-span-4">
              <MetricBadge
                accent="blue"
                label="Safety buffer"
                value={fmtMW(summary.buffer)}
                unit="MW"
                hint={`Added on top of the shortfall. It is the ${pct(confidence)} point of past forecast errors.`}
              />
              <MetricBadge
                label="Would the buffer have held?"
                value={coverage == null ? "—" : pct(coverage)}
                hint="Past half-hours where the forecast miss was no bigger than the buffer. Should be close to your confidence level."
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricBadge
              label="Half-hours needing thermal"
              value={summary.needShare == null ? "—" : pct(summary.needShare)}
              hint={`At ${fmtMW(appliedDemand)} MW of demand.`}
            />
            <MetricBadge label="Total thermal energy" value={fmtMW(summary.totalMwh)} unit="MWh" hint="Sum of the top-ups over the period." />
            <MetricBadge
              accent={summary.surplusShare ? "amber" : "none"}
              label="Wind surplus"
              value={summary.surplusShare == null ? "—" : pct(summary.surplusShare)}
              hint={
                summary.surplusShare
                  ? `Half-hours where forecast wind alone beats demand, by up to ${fmtMW(summary.maxSurplusMw)} MW. That excess may be spilled.`
                  : "No half-hours where forecast wind alone beats demand."
              }
            />
            <MetricBadge
              label="No forecast"
              value={fmtMW(summary.missing)}
              hint="Half-hours skipped because Elexon has no forecast for them."
            />
          </div>
          <p className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            The buffer comes from errors in the dates you picked. It is a planning aid, not a guarantee for later months. Demand is a flat
            figure you set, not a demand forecast.{" "}
            {fmtPct(metrics.mape) !== "—" && `Typical forecast miss in this period: ${fmtPct(metrics.mape)}.`}
          </p>
        </div>
      )}
    </div>
  );
}