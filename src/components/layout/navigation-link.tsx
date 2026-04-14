"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type NavigationLinkProps = {
  item: NavigationItem;
  active: boolean;
  collapsed: boolean;
  pending?: boolean;
  onNavigate?: (href: string) => void;
};

export function NavigationLink({
  item,
  active,
  collapsed,
  pending = false,
  onNavigate,
}: NavigationLinkProps) {
  const router = useRouter();
  const Icon = item.icon;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !onNavigate ||
      pending ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onNavigate(item.href);
  }

  return (
    <Link
      href={item.href}
      prefetch
      title={collapsed ? item.title : undefined}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => router.prefetch(item.href)}
      onFocus={() => router.prefetch(item.href)}
      onClick={handleClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-[20px] border px-3 py-3 text-sm transition-all duration-200",
        collapsed ? "justify-center lg:px-0" : "justify-start",
        active
          ? "border-white/12 bg-linear-to-r from-white/[0.12] to-blue-400/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_14px_24px_-20px_rgba(8,26,50,0.7)]"
          : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.055] hover:text-white",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-2 left-0 w-1 rounded-r-full transition-opacity",
          active ? "bg-blue-400 opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
          active
            ? "border-blue-300/20 bg-blue-400/12 text-blue-50"
            : "border-white/8 bg-white/[0.04] text-slate-300 group-hover:border-white/12 group-hover:bg-white/[0.08] group-hover:text-white",
          pending && "border-blue-300/20 bg-blue-400/12 text-blue-50",
        )}
      >
        {pending ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>

      <span className={cn("min-w-0 flex-1", collapsed && "lg:sr-only")}>
        <span className="block truncate font-medium tracking-[0.01em]">{item.title}</span>
        <span
          className={cn(
            "mt-0.5 block truncate text-xs",
            active ? "text-slate-300" : "text-slate-400",
          )}
        >
          {pending ? "Loading page data..." : item.description}
        </span>
      </span>
    </Link>
  );
}
