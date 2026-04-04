"use client";

import Image from "next/image";
import { ChevronDown, LoaderCircle, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileDialog } from "@/components/profile/profile-dialog";
import { getCurrentUserProfile, type UserProfileRecord } from "@/lib/api/profile";
import { performClientLogout } from "@/lib/auth/client-auth";
import type { AppRole } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  currentRole: AppRole | null;
  currentUsername: string | null;
  currentDisplayRole: string | null;
};

export function ProfileMenu({
  currentRole,
  currentUsername,
  currentDisplayRole,
}: ProfileMenuProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    void loadProfile({ silent: false });
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function loadProfile(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoadingProfile(true);
    }

    try {
      const nextProfile = await getCurrentUserProfile();
      setProfile(nextProfile);
      setProfileErrorMessage(null);
    } catch (error) {
      setProfileErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the current user profile.",
      );
    } finally {
      if (!options?.silent) {
        setIsLoadingProfile(false);
      }
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await performClientLogout("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  const displayName =
    profile?.full_name ||
    currentUsername ||
    (currentRole === "employee" ? "Employee" : "Admin");
  const roleLabel = formatRoleLabel(
    profile?.role ?? currentDisplayRole ?? currentRole,
  );

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <ProfileAvatar imageUrl={profile?.profile_image_url ?? null} displayName={displayName} />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium text-slate-900">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {roleLabel ?? "Workspace access"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "hidden h-4 w-4 text-slate-500 transition sm:block",
              menuOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 z-30 mt-3 w-[280px] rounded-[28px] border border-slate-200/80 bg-white p-3 shadow-2xl shadow-slate-950/10">
            <div className="rounded-[24px] bg-slate-50/80 px-4 py-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  imageUrl={profile?.profile_image_url ?? null}
                  displayName={displayName}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {profile?.email ?? "Loading account..."}
                  </p>
                </div>
              </div>
            </div>

            {profileErrorMessage ? (
              <p className="px-2 pb-2 pt-3 text-xs leading-5 text-rose-600">
                {profileErrorMessage}
              </p>
            ) : null}

            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setDialogOpen(true);
                  if (!profile) {
                    void loadProfile({ silent: false });
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <UserRound className="h-4 w-4" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ProfileDialog
        open={dialogOpen}
        profile={profile}
        isLoadingProfile={isLoadingProfile}
        profileErrorMessage={profileErrorMessage}
        onClose={() => setDialogOpen(false)}
        onRefreshProfile={() => loadProfile({ silent: false })}
        onProfileUpdated={(nextProfile) => {
          setProfile(nextProfile);
          setProfileErrorMessage(null);
          router.refresh();
        }}
      />
    </>
  );
}

function ProfileAvatar({
  imageUrl,
  displayName,
  size = "default",
}: {
  imageUrl: string | null;
  displayName: string;
  size?: "default" | "lg";
}) {
  const className =
    size === "lg"
      ? "h-12 w-12 rounded-full"
      : "h-10 w-10 rounded-full";

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={displayName}
        width={size === "lg" ? 48 : 40}
        height={size === "lg" ? 48 : 40}
        unoptimized
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-slate-900 text-sm font-semibold text-white`}
    >
      {getInitials(displayName)}
    </div>
  );
}

function formatRoleLabel(value: string | AppRole | null) {
  if (!value) {
    return null;
  }

  return value
    .trim()
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(value: string) {
  const parts = value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
