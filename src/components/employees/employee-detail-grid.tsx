import { DetailItem } from "@/components/ui/detail-item";

type DetailItem = {
  label: string;
  value: string;
};

type EmployeeDetailGridProps = {
  items: DetailItem[];
  columns?: "two" | "three";
};

export function EmployeeDetailGrid({
  items,
  columns = "three",
}: EmployeeDetailGridProps) {
  return (
    <div
      className={
        columns === "two"
          ? "grid gap-4 md:grid-cols-2"
          : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      }
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4"
        >
          <DetailItem
            label={item.label}
            value={item.value}
            valueClassName="font-medium text-slate-900"
          />
        </div>
      ))}
    </div>
  );
}
