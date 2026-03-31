import { FileText, ReceiptText } from "lucide-react";
import { APP_NAME } from "@/config/branding";

type PayslipPreviewCardProps = {
  employeeName: string;
  employeeId: string;
  period: string;
  grossPay: string;
  deductions: string;
  netPay: string;
};

export function PayslipPreviewCard({
  employeeName,
  employeeId,
  period,
  grossPay,
  deductions,
  netPay,
}: PayslipPreviewCardProps) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200/80 bg-slate-50/70 px-6 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Payslip preview
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              {employeeName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {employeeId} • {period}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {APP_NAME}
                  </p>
                  <p className="text-sm text-slate-500">
                    Employee earnings statement
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Period
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{period}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <PreviewStat label="Gross Pay" value={grossPay} />
            <PreviewStat label="Deductions" value={deductions} />
            <PreviewStat label="Net Pay" value={netPay} emphasis />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <PreviewDetail label="Employee" value={employeeName} />
            <PreviewDetail label="Employee ID" value={employeeId} />
            <PreviewDetail label="Payroll Schedule" value="Monthly" />
            <PreviewDetail label="Release Status" value="Ready for publishing" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-lg font-semibold ${
          emphasis ? "text-slate-950" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PreviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

