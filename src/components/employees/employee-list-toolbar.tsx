import { Search } from "lucide-react";

const filterOptions = {
  departments: ["All Departments", "Finance", "Human Resources", "Operations"],
  statuses: ["All Statuses", "Active", "On Leave", "Pending", "Inactive"],
  payrollSchedules: ["All Schedules", "Monthly", "Semi-monthly", "Bi-weekly", "Weekly"],
};

export function EmployeeListToolbar() {
  return (
    <div className="ui-toolbar">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Directory filters</p>
          <p className="mt-1 text-sm text-slate-500">
            Narrow the employee list by department, status, or payroll schedule.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="relative block">
          <span className="sr-only">Search employees</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by employee ID, name, or role"
            className="ui-input pl-11 pr-4"
          />
        </label>

        <FilterSelect
          label="Department"
          options={filterOptions.departments}
          defaultValue="All Departments"
        />
        <FilterSelect
          label="Employment Status"
          options={filterOptions.statuses}
          defaultValue="All Statuses"
        />
        <FilterSelect
          label="Payroll Schedule"
          options={filterOptions.payrollSchedules}
          defaultValue="All Schedules"
        />
      </div>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  options: string[];
  defaultValue: string;
};

function FilterSelect({ label, options, defaultValue }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <select
        defaultValue={defaultValue}
        className="ui-select"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
