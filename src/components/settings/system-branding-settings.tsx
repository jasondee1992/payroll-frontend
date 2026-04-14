"use client";

import type { RefObject } from "react";
import { LoaderCircle, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { BrandingRecord } from "@/types/branding";

type SystemBrandingSettingsProps = {
  initialBranding: BrandingRecord;
  companyLogoUrl: string | null;
  loginBackgroundUrl: string | null;
};

export function SystemBrandingSettings({
  initialBranding,
  companyLogoUrl,
  loginBackgroundUrl,
}: SystemBrandingSettingsProps) {
  const router = useRouter();
  const [branding, setBranding] = useState(initialBranding);
  const [companyName, setCompanyName] = useState(initialBranding.companyName);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(companyLogoUrl);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] =
    useState(loginBackgroundUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<
    "logo" | "background" | "delete-logo" | "delete-background" | null
  >(null);
  const [isSaving, startSaving] = useTransition();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);

  function applyBranding(nextBranding: BrandingRecord) {
    setBranding(nextBranding);
    setCompanyName(nextBranding.companyName);
  }

  function resetMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function setFailure(value: string) {
    setErrorMessage(value);
    setSuccessMessage(null);
  }

  function setSuccess(value: string) {
    setSuccessMessage(value);
    setErrorMessage(null);
  }

  async function saveCompanyName(trimmedCompanyName: string) {
    try {
      const response = await fetch("/api/settings/branding", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: trimmedCompanyName,
        }),
      });
      const responseBody = (await response.json()) as {
        error?: string;
        branding?: BrandingRecord;
      };

      if (!response.ok || !responseBody.branding) {
        setFailure(responseBody.error ?? "Unable to update the company name.");
        return;
      }

      applyBranding(responseBody.branding);
      setSuccess("Company name updated.");
      router.refresh();
    } catch {
      setFailure("Unable to reach the branding settings route.");
    }
  }

  async function handleSaveCompanyName() {
    const trimmedCompanyName = companyName.trim();

    if (!trimmedCompanyName) {
      setFailure("Company name is required.");
      return;
    }

    resetMessages();
    startSaving(() => {
      void saveCompanyName(trimmedCompanyName);
    });
  }

  async function uploadBrandingImage(
    kind: "logo" | "background",
    file: File | null,
  ) {
    if (!file) {
      return;
    }

    resetMessages();
    setPendingUpload(kind);

    try {
      const formData = new FormData();
      formData.append("image", file, file.name);

      const response = await fetch(
        kind === "logo"
          ? "/api/settings/branding/logo"
          : "/api/settings/branding/login-background",
        {
          method: "POST",
          body: formData,
        },
      );
      const responseBody = (await response.json()) as {
        error?: string;
        branding?: BrandingRecord;
        assetUrl?: string | null;
      };

      if (!response.ok || !responseBody.branding) {
        setFailure(responseBody.error ?? "Unable to upload the branding image.");
        return;
      }

      applyBranding(responseBody.branding);

      if (kind === "logo") {
        setLogoPreviewUrl(responseBody.assetUrl ?? null);
        if (logoInputRef.current) {
          logoInputRef.current.value = "";
        }
        setSuccess("Company logo updated.");
      } else {
        setBackgroundPreviewUrl(responseBody.assetUrl ?? null);
        if (backgroundInputRef.current) {
          backgroundInputRef.current.value = "";
        }
        setSuccess("Login background updated.");
      }
      router.refresh();
    } catch {
      setFailure("Unable to upload the branding image.");
    } finally {
      setPendingUpload(null);
    }
  }

  async function deleteBrandingImage(kind: "logo" | "background") {
    resetMessages();
    setPendingUpload(kind === "logo" ? "delete-logo" : "delete-background");

    try {
      const response = await fetch(
        kind === "logo"
          ? "/api/settings/branding/logo"
          : "/api/settings/branding/login-background",
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );
      const responseBody = (await response.json()) as {
        error?: string;
        branding?: BrandingRecord;
      };

      if (!response.ok || !responseBody.branding) {
        setFailure(responseBody.error ?? "Unable to delete the branding image.");
        return;
      }

      applyBranding(responseBody.branding);

      if (kind === "logo") {
        setLogoPreviewUrl(null);
        if (logoInputRef.current) {
          logoInputRef.current.value = "";
        }
        setSuccess("Company logo removed.");
      } else {
        setBackgroundPreviewUrl(null);
        if (backgroundInputRef.current) {
          backgroundInputRef.current.value = "";
        }
        setSuccess("Login background removed.");
      }

      router.refresh();
    } catch {
      setFailure("Unable to delete the branding image.");
    } finally {
      setPendingUpload(null);
    }
  }

  return (
    <section className="panel p-6 sm:p-7">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          System Branding
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Company identity and login appearance
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Update the client-facing company name, sidebar/login logo, and login
          background image without changing payroll business logic or internal
          identifiers.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5">
            <label
              htmlFor="company-name"
              className="text-sm font-semibold text-slate-900"
            >
              Company Name
            </label>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This updates visible branding text across the login screen,
              sidebar, and other company identity surfaces.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                id="company-name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Company Payroll"
              />
              <button
                type="button"
                onClick={handleSaveCompanyName}
                disabled={isSaving}
                className="ui-button-primary min-w-36 justify-center"
              >
                {isSaving ? "Saving..." : "Save Name"}
              </button>
            </div>
          </div>

          <UploadCard
            title="Company Logo"
            description="Shown in the sidebar and public authentication or branding sections."
            previewUrl={logoPreviewUrl}
            previewLabel={branding.companyName}
            inputRef={logoInputRef}
            busy={pendingUpload === "logo"}
            deleting={pendingUpload === "delete-logo"}
            onSelect={(file) => void uploadBrandingImage("logo", file)}
            onDelete={
              logoPreviewUrl
                ? () => {
                    void deleteBrandingImage("logo");
                  }
                : undefined
            }
          />

          <UploadCard
            title="Login Background"
            description="Used on the login page so each client workspace can match company visuals."
            previewUrl={backgroundPreviewUrl}
            previewLabel="Login background preview"
            inputRef={backgroundInputRef}
            busy={pendingUpload === "background"}
            deleting={pendingUpload === "delete-background"}
            onSelect={(file) => void uploadBrandingImage("background", file)}
            onDelete={
              backgroundPreviewUrl
                ? () => {
                    void deleteBrandingImage("background");
                  }
                : undefined
            }
            previewHeight="h-40"
          />
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Current Preview
          </p>
          <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div
              className="relative min-h-72 p-6"
              style={
                backgroundPreviewUrl
                  ? {
                      backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.78), rgba(15,23,42,0.38)), url(${backgroundPreviewUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            >
              {!backgroundPreviewUrl ? (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_52%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,0.92))]" />
              ) : null}
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85">
                    {logoPreviewUrl ? (
                      <div
                        className="h-8 w-8 rounded-xl bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${logoPreviewUrl})` }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-xl bg-slate-900" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                      Client Workspace
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {branding.companyName}
                    </p>
                  </div>
                </div>
                <div className="max-w-sm rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
                  <p className="text-sm font-medium">Sign in to your workspace</p>
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    Preview how the public authentication screen will carry the
                    company identity after saving.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {successMessage ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function UploadCard({
  title,
  description,
  previewUrl,
  previewLabel,
  inputRef,
  busy,
  deleting,
  onSelect,
  onDelete,
  previewHeight = "h-28",
}: {
  title: string;
  description: string;
  previewUrl: string | null;
  previewLabel: string;
  inputRef: RefObject<HTMLInputElement | null>;
  busy: boolean;
  deleting: boolean;
  onSelect: (file: File | null) => void;
  onDelete?: () => void;
  previewHeight?: string;
}) {
  const fieldId = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div
          className={`w-full rounded-[22px] border border-slate-200 bg-white ${previewHeight} lg:max-w-56`}
        >
          {previewUrl ? (
            <div
              className="h-full w-full rounded-[22px] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${previewUrl})` }}
              aria-label={previewLabel}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-[22px] text-sm text-slate-400">
              No file uploaded
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={fieldId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{busy ? "Uploading..." : "Choose Image"}</span>
            </label>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={busy || deleting}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-100 disabled:bg-rose-50 disabled:text-rose-300"
              >
                {deleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{deleting ? "Removing..." : "Delete Image"}</span>
              </button>
            ) : null}
          </div>
          <input
            id={fieldId}
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
          />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Accepts JPG, PNG, or WEBP up to 5 MB. Delete will revert this area to the default system appearance.
          </p>
        </div>
      </div>
    </div>
  );
}
