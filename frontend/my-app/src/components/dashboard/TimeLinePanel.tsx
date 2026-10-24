import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS } from "../../lib/chartTheme";
import type { DataPoint } from "../../types";
import Button from "../common/Button";
import Card from "../common/Card";
import TimeSeriesCanvasChart from "../charts/TimeSeriesCanvasChart";

type Mode = "24h" | "7d" | "full";
interface Win {
  mode: Mode;
  step: number;
}

const DAY = 864e5;
const LENGTH = { "24h": DAY, "7d": 7 * DAY };
const UNIT = { "24h": "Day", "7d": "Week" };

/** The visible window for a preset, plus how many steps that preset has across the data. */
function plan(data: DataPoint[], win: Win) {
  const first = data[0].time.getTime();
  const last = data[data.length - 1].time.getTime();
  if (win.mode === "full") return { view: [new Date(first), new Date(last)] as [Date, Date], steps: 1, step: 0 };

  const len = LENGTH[win.mode];
  const steps = Math.max(1, Math.ceil((last - first) / len));
  const step = Math.min(win.step, steps - 1);
  const start = first + step * len;
  return { view: [new Date(start), new Date(Math.min(start + len, last))] as [Date, Date], steps, step };
}

/** Chart plus the controls for it: which lines to show, how far to zoom, and stepping through time. */
export default function TimelinePanel({ data }: { data: DataPoint[] }) {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [win, setWin] = useState<Win>({ mode: "full", step: 0 });
  const { view, steps, step } = useMemo(() => plan(data, win), [data, win]);

  // Every click makes a new window object, so choosing a preset again re-centres the chart after manual zooming.
  const choose = (mode: Mode) => setWin({ mode, step: 0 });
  const move = (delta: number) => setWin({ mode: win.mode, step: step + delta });

  const group = "flex flex-wrap items-center gap-2";
  return (
    <Card
      title="Actual and forecast wind generation"
      description="Hover for exact values. Red shading marks half-hours where the forecast was too high; amber marks where wind beat the forecast."
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-dashed border-slate-600 pb-4">
        <div className={group} role="group" aria-label="Lines to show">
          <span className="text-sm text-slate-400">Show</span>
          <Button active={showActual} disabled={showActual && !showForecast} onClick={() => setShowActual(!showActual)}>
            <span className="h-0.5 w-4" style={{ background: COLORS.actual }} aria-hidden />
            Actual
          </Button>
          <Button active={showForecast} disabled={showForecast && !showActual} onClick={() => setShowForecast(!showForecast)}>
            <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: COLORS.forecast }} aria-hidden />
            Forecast
          </Button>
        </div>

        <div className={group} role="group" aria-label="Zoom">
          <span className="text-sm text-slate-400">Zoom</span>
          <Button active={win.mode === "24h"} onClick={() => choose("24h")}>
            1 day
          </Button>
          <Button active={win.mode === "7d"} onClick={() => choose("7d")}>
            1 week
          </Button>
          <Button active={win.mode === "full"} onClick={() => choose("full")}>
            Whole range
          </Button>
        </div>

        <div className={group} role="group" aria-label="Move through time">
          <Button aria-label={`Earlier ${win.mode === "7d" ? "week" : "day"}`} disabled={win.mode === "full" || step === 0} onClick={() => move(-1)}>
            <ChevronLeft size={16} aria-hidden />
            Earlier
          </Button>
          <Button aria-label={`Later ${win.mode === "7d" ? "week" : "day"}`} disabled={win.mode === "full" || step >= steps - 1} onClick={() => move(1)}>
            Later
            <ChevronRight size={16} aria-hidden />
          </Button>
          {win.mode !== "full" && (
            <span className="text-sm text-slate-400">
              {UNIT[win.mode]} {step + 1} of {steps}
            </span>
          )}
        </div>
      </div>

      <TimeSeriesCanvasChart data={data} showActual={showActual} showForecast={showForecast} view={view} height={420} />
    </Card>
  );
}