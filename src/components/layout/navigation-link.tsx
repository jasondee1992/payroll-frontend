import Link from "next/link";
import type { NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type NavigationLinkProps = {
  item: NavigationItem;
  active: boolean;
  collapsed: boolean;
};

export function NavigationLink({
  item,
  active,
  collapsed,
}: NavigationLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.title : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all",
        collapsed ? "justify-center lg:px-0" : "justify-start",
        active
          ? "border-white/10 bg-white/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]"
          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full transition-opacity",
          active ? "bg-blue-400 opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-blue-400/15 text-blue-100"
            : "bg-white/[0.05] text-slate-300 group-hover:bg-white/[0.10] group-hover:text-white",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className={cn("min-w-0 flex-1", collapsed && "lg:sr-only")}>
        <span className="block truncate font-medium">{item.title}</span>
        <span
          className={cn(
            "mt-0.5 block truncate text-xs",
            active ? "text-slate-300" : "text-slate-400",
          )}
        >
          {item.description}
        </span>
      </span>
    </Link>
  );
}
