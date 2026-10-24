import { fmtMW } from "../../lib/format";
import type { BandPoint, Metrics } from "../../types";
import Card from "../common/Card";
import MetricBadge from "../common/MetricBadge";
import QuantileBandChart from "../charts/QuantileBandChart";

interface UncertaintyPanelProps {
  bandData: BandPoint[];
  coverage: number | null;
  metrics: Metrics;
}

export default function UncertaintyPanel({ bandData, coverage, metrics }: UncertaintyPanelProps) {
  const { p10, p90 } = metrics;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card
        className="lg:col-span-8"
        title="Where actual output tends to land"
        description="The shaded band runs from the forecast minus the P90 error to the forecast minus the P10 error."
      >
        <QuantileBandChart bandData={bandData} coverage={coverage} height={340} />
      </Card>

      <div className="space-y-4 lg:col-span-4">
        <MetricBadge
          accent="blue"
          label="Inside the band"
          value={coverage == null ? "—" : `${Math.round(coverage * 100)}%`}
          hint="Share of half-hours where actual output landed inside the shaded band. The band is built to cover 80%."
        />
        <Card title="What to plan for">
          <div className="space-y-2 text-slate-300">
            {p90 != null && p90 > 0 && <p>In 1 of 10 half-hours the forecast was too high by more than {fmtMW(p90)} MW.</p>}
            {p10 != null && p10 < 0 && <p>In 1 of 10 it was too low by more than {fmtMW(-p10)} MW.</p>}
            {(p90 == null || p90 <= 0) && (p10 == null || p10 >= 0) && <p>Errors in this period were small and one-sided.</p>}
          </div>
        </Card>
        <p className="border border-dashed border-slate-600 p-4 text-sm text-slate-400">
          The band is built from the errors in the dates you picked, so it shows how the forecast behaved here, not a promise for later months.
        </p>
      </div>
    </div>
  );
}