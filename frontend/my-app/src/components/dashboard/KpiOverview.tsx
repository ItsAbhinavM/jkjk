import { fmtDateTime, fmtMW, fmtPct, fmtSigned } from "../../lib/format";
import { biasVerdict, type ErrorSummary } from "../../lib/summary";
import type { Metrics } from "../../types";
import Card from "../common/Card";
import MetricBadge from "../common/MetricBadge";

interface KpiOverviewProps {
  metrics: Metrics;
  summary: ErrorSummary;
}

/** The accuracy numbers as a bento grid: the two headline measures large, the rest smaller. */
export default function KpiOverview({ metrics, summary }: KpiOverviewProps) {
  const { mae, rmse, mape, bias, count, p10, p50, p90 } = metrics;
  const { overShare, maxOver, maxUnder } = summary;
  const verdict = biasVerdict(bias);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricBadge
        className="col-span-2"
        accent="blue"
        label="Average miss (MAE)"
        value={fmtMW(mae)}
        unit="MW"
        hint="How far off the forecast was in a typical half-hour, whether too high or too low."
      />
      <MetricBadge
        className="col-span-2"
        accent={bias != null && bias > 0 ? "red" : "amber"}
        label="Average bias"
        value={fmtSigned(bias)}
        unit="MW"
        badge={verdict ?? undefined}
        hint="Forecast minus actual, averaged. Above zero means the forecast ran high."
      />

      <MetricBadge label="Large-miss measure (RMSE)" value={fmtMW(rmse)} unit="MW" hint="Like the average miss, but big misses count for more." />
      <MetricBadge label="Miss as a share of output (MAPE)" value={fmtPct(mape)} hint="Slots under 10 MW are treated as 10 MW to avoid blow-ups." />
      <MetricBadge
        accent="red"
        label="Forecast too high"
        value={overShare == null ? "—" : `${Math.round(overShare * 100)}%`}
        hint="Share of half-hours where the forecast was above actual."
      />
      <MetricBadge label="Half-hours compared" value={fmtMW(count)} hint="Half-hours with both an actual and a forecast." />

      <Card className="col-span-2" title="Typical range of errors" description="Forecast minus actual, in MW. Negative means too low.">
        <dl className="grid grid-cols-3 gap-3">
          {[
            ["Low end (P10)", p10],
            ["Middle (P50)", p50],
            ["High end (P90)", p90],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-sm text-slate-400">{label}</dt>
              <dd className="font-display text-3xl font-semibold">{fmtSigned(value as number | null)}</dd>
            </div>
          ))}
        </dl>
        {p90 != null && p90 > 0 && (
          <p className="mt-3 text-sm text-slate-400">In 1 of 10 half-hours the forecast was too high by more than {fmtMW(p90)} MW.</p>
        )}
      </Card>
      <MetricBadge
        accent="red"
        label="Largest over-forecast"
        value={maxOver ? fmtSigned(maxOver.value) : "—"}
        unit="MW"
        hint={maxOver ? fmtDateTime(maxOver.time) : undefined}
      />
      <MetricBadge
        accent="amber"
        label="Largest under-forecast"
        value={maxUnder ? fmtSigned(maxUnder.value) : "—"}
        unit="MW"
        hint={maxUnder ? fmtDateTime(maxUnder.time) : undefined}
      />
    </div>
  );
}