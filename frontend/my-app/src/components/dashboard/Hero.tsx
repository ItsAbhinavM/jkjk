import { buttonClasses } from "../../lib/buttonStyles";
import { fmtMW } from "../../lib/format";
import type { ErrorSummary } from "../../lib/summary";
import type { Metrics } from "../../types";
import Card from "../common/Card";

/** One sentence that states the finding for the selected dates, built from the live numbers. */
function headline(metrics: Metrics | null, summary: ErrorSummary, loading: boolean): string {
  if (!metrics || metrics.count === 0 || metrics.bias == null) {
    return loading ? "Loading the data…" : "There is no overlapping actual and forecast data for these dates.";
  }
  const high = metrics.bias >= 0;
  const share = high ? summary.overShare : summary.underShare;
  const tail = share == null ? "" : ` It was too ${high ? "high" : "low"} in ${Math.round(share * 100)}% of them.`;
  return `Across ${fmtMW(metrics.count)} half-hours, the forecast averaged ${fmtMW(Math.abs(metrics.bias))} MW ${
    high ? "above" : "below"
  } what wind actually delivered.${tail}`;
}

interface HeroProps {
  metrics: Metrics | null;
  summary: ErrorSummary;
  loading: boolean;
  className?: string;
}

export default function Hero({ metrics, summary, loading, className }: HeroProps) {
  return (
    <Card className={`rounded-[40px] px-6 py-12 text-center sm:px-16 sm:py-16 ${className ?? ""}`}>
      <h1 className="font-display text-xl font-semibold text-violet-700">UK day-ahead wind forecast accuracy</h1>
      <p className="mx-auto mt-5 max-w-4xl text-balance font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">{headline(metrics, summary, loading)}</p>
      <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
        When wind comes in under the forecast, the shortfall has to be covered at short notice. This page shows how often that
        happened and by how much.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="#timeline" className={buttonClasses("primary")}>
          See the timeline
        </a>
        <a href="#accuracy" className={buttonClasses("ghost")}>
          Jump to accuracy numbers
        </a>
      </div>
    </Card>
  );
}