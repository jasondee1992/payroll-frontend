type ReportPreviewCardProps = {
  title: string;
  description: string;
  highlights: Array<{ label: string; value: string }>;
};

export function ReportPreviewCard({
  title,
  description,
  highlights,
}: ReportPreviewCardProps) {
  return (
    <section className="panel p-6 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <ReportRow label="Department payroll cost" value="PHP 198,400" delta="+4.3%" />
            <ReportRow label="Attendance deductions" value="PHP 12,850" delta="-1.1%" />
            <ReportRow label="Overtime allocation" value="PHP 18,320" delta="+7.8%" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportRow({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{delta} vs prior period</p>
    </div>
  );
}

