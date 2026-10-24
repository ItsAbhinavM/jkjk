import { fmtDateTime, fmtMW, fmtSigned } from "../../lib/format";
import { biasVerdict, type ErrorSummary } from "../../lib/summary";
import type { Metrics } from "../../types";
import MetricBadge from "../common/MetricBadge";

interface KpiOverviewProps {
  metrics: Metrics;
  summary: ErrorSummary;
}

/** The four numbers a buyer needs: typical miss, direction of the miss, worst miss and the margin to hold. */
export default function KpiOverview({ metrics, summary }: KpiOverviewProps) {
  const { mae, rmse, bias, p90 } = metrics;
  const { maxOver } = summary;
  const verdict = biasVerdict(bias);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <MetricBadge
        accent="blue"
        label="Average miss (MAE)"
        value={fmtMW(mae)}
        unit="MW"
        hint={`How far off the forecast was in a typical half-hour. Big misses weigh more in RMSE: ${fmtMW(rmse)} MW.`}
      />
      <MetricBadge
        accent={bias != null && bias > 0 ? "red" : "amber"}
        label="Average bias"
        value={fmtSigned(bias)}
        unit="MW"
        badge={verdict ?? undefined}
        hint="Forecast minus actual, averaged. Above zero means the forecast ran high."
      />
      <MetricBadge
        accent="red"
        label="Peak shortfall"
        value={maxOver ? fmtSigned(maxOver.value) : "—"}
        unit="MW"
        hint={maxOver ? `Worst half-hour: forecast too high on ${fmtDateTime(maxOver.time)}.` : "The forecast was never too high."}
      />
      <MetricBadge
        accent="emerald"
        label="Recommended safety margin"
        value={fmtMW(p90)}
        unit="MW"
        hint={
          <>
            Covers 90% of past misses. Pick your own level in{" "}
            <a href="#procurement" className="font-medium text-violet-700 underline">
              Procurement
            </a>
            .
          </>
        }
      />
    </div>
  );
}