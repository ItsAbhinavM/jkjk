import Card from "../common/Card";

export default function MethodPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-12">
      <Card className="md:col-span-5" accent="emerald" title="Actual output">
        <p className="text-slate-300">
          Half-hourly wind generation reported by Elexon (dataset FUELHH, fuel type WIND), in MW. Negative values are set to 0. Half-hours
          Elexon did not report stay blank instead of being filled with zero.
        </p>
      </Card>
      <Card className="md:col-span-7" accent="blue" title="Forecast">
        <p className="text-slate-300">
          Elexon's wind generation forecast (dataset WINDFOR). It is published several times a day with one value per hour, so each
          hourly value is used for both half-hours inside that hour.
        </p>
      </Card>
      <Card className="md:col-span-7" title="Which forecast is compared">
        <p className="text-slate-300">
          To mimic a day-ahead purchase, each half-hour is compared with the latest forecast published at least 14 hours before it. For
          deliveries late in the day, that rule can pick a forecast issued on the day itself, after the day-ahead decision.
        </p>
      </Card>
      <Card className="md:col-span-5" title="Reading the numbers">
        <p className="text-slate-300">
          Error is forecast minus actual, so a positive error means the forecast was too high. The forecast sits above actual in most
          half-hours. Part of that gap may come from differences in what the two datasets cover, which this page does not check.
        </p>
      </Card>
    </div>
  );
}