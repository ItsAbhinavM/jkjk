import { useMemo } from "react";
import ErrorDistributionD3 from "./components/charts/ErrorDistributionD3";
import Button from "./components/common/Button";
import Card from "./components/common/Card";
import DataTablePanel from "./components/dashboard/DataTablePanel";
import FilterBar from "./components/dashboard/FilterBar";
import Hero from "./components/dashboard/Hero";
import KpiOverview from "./components/dashboard/KpiOverview";
import MethodPanel from "./components/dashboard/MethodPanel";
import TimelinePanel from "./components/dashboard/TimeLinePanel";
import UncertaintyPanel from "./components/dashboard/UncertaintyPanel";
import ProcurementPanel from "./components/dashboard/ProcurementPanel";
import Header from "./components/layout/Header";
import Section from "./components/layout/Section";
import { useActiveSection } from "./hooks/useActiveSection";
import { useAnalytics } from "./hooks/useAnalytics";
import { FULL_RANGE, useElexonData } from "./hooks/useElexonData";
import { fmtDay } from "./lib/format";
import { summariseErrors } from "./lib/summary";

const SECTIONS = [
  { id: "timeline", label: "Timeline" },
  { id: "accuracy", label: "Accuracy" },
  { id: "procurement", label: "Procurement" },
  { id: "uncertainty", label: "Uncertainty" },
  { id: "data", label: "Data" },
  { id: "method", label: "Method" },
] as const;
const SECTION_IDS = SECTIONS.map((s) => s.id);

export default function App() {
  const { data, metrics, loading, error, dateRange, dataRange, setDateRange } = useElexonData();
  const { bandData, coverage } = useAnalytics(data, metrics);
  const summary = useMemo(() => summariseErrors(data), [data]);
  const active = useActiveSection(SECTION_IDS);

  const hasSeries = data.length > 0;
  const hasMetrics = metrics != null && metrics.count > 0;
  // Panels remount when the data they show changes range, so zoom and day selection start fresh.
  const dataKey = dataRange.join("_");
  const rangeLabel = dateRange[0] === dateRange[1] ? fmtDay(dateRange[0]) : `${fmtDay(dateRange[0])} to ${fmtDay(dateRange[1])}`;

  const empty = (
    <Card title="No data for these dates" description="Elexon has no records for the dates you picked.">
      <Button onClick={() => setDateRange(FULL_RANGE)}>Show the whole month</Button>
    </Card>
  );

  return (
    <div id="top">
      <Header sections={SECTIONS} active={active} rangeLabel={rangeLabel} loading={loading} />

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-8 sm:px-6">
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-200">
            <span>Couldn't load data: {error}. Check that the backend is running.</span>
            <Button onClick={() => setDateRange([...dateRange])}>Try again</Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-12">
          <Hero className="lg:col-span-7" metrics={metrics} summary={summary} loading={loading} />
          <div id="range" className="scroll-mt-20 lg:col-span-5">
            <FilterBar key={dateRange.join("_")} value={dateRange} min={FULL_RANGE[0]} max={FULL_RANGE[1]} onApply={setDateRange} className="h-full" />
          </div>
        </div>

        <Section id="timeline" title="Timeline" intro="Actual wind output against the day-ahead forecast. Zoom in to see a single day.">
          {hasSeries ? <TimelinePanel key={dataKey} data={data} /> : loading ? <Card title="Loading the data…" /> : empty}
        </Section>

        <Section id="accuracy" title="Accuracy" intro="How big the misses were, and which way they leaned.">
          {hasMetrics ? (
            <div className="space-y-4">
              <KpiOverview metrics={metrics} summary={summary} />
              <div className="grid gap-4 lg:grid-cols-12">
                <Card
                  className="lg:col-span-8"
                  title="How the errors are spread"
                  description="Each bar counts half-hours with an error in that range. Dashed lines mark the P10, P50 and P90 errors."
                >
                  <ErrorDistributionD3 errors={metrics.error_distribution} p10={metrics.p10} p50={metrics.p50} p90={metrics.p90} height={320} />
                </Card>
                <Card className="lg:col-span-4" title="How to read it">
                  <div className="space-y-3 text-slate-300">
                    <p>Bars to the right of zero are half-hours where the forecast was too high. Those are the ones that leave you short.</p>
                    <p>Bars to the left are half-hours where wind beat the forecast.</p>
                    <p>Solid colour marks the extremes, beyond the P10 and P90 lines.</p>
                  </div>
                </Card>
              </div>
            </div>
          ) : loading ? (
            <Card title="Loading the numbers…" />
          ) : (
            empty
          )}
        </Section>

        <Section id="uncertainty" title="Uncertainty" intro="The range wind output usually fell in, given how the forecast has behaved.">
          {hasMetrics ? <UncertaintyPanel bandData={bandData} coverage={coverage} metrics={metrics} /> : loading ? <Card title="Loading…" /> : empty}
        </Section>

        <Section id="procurement" title="Procurement" intro="Set your demand and how sure you need to be. Get the thermal top-up to buy, with a safety buffer for forecast misses.">
          {hasMetrics ? <ProcurementPanel key={dataKey} range={dataRange} data={data} metrics={metrics} /> : loading ? <Card title="Loading…" /> : empty}
        </Section>

        <Section id="data" title="Data" intro="The half-hourly values behind every chart. Download them or browse a day at a time.">
          {hasSeries ? <DataTablePanel key={dataKey} data={data} range={dataRange} /> : loading ? <Card title="Loading…" /> : empty}
        </Section>

        <Section id="method" title="Method" intro="Where the numbers come from and what they do not tell you.">
          <MethodPanel />
        </Section>
      </main>

      <footer className="border-t border-slate-600 bg-slate-900/95">
        <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-400 sm:px-6">
          Data from Elexon's Balancing Mechanism Reporting Service (BMRS). Times are UTC.
        </p>
      </footer>
    </div>
  );
}