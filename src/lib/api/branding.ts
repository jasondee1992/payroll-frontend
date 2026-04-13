import { apiClient } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";
import { DEFAULT_BRANDING } from "@/config/branding";
import { parseRecord, parseString } from "@/lib/api/parsers";
import { loadApiResource } from "@/lib/api/resources";
import type { BrandingRecord } from "@/types/branding";

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

export function parseBrandingRecord(value: unknown): BrandingRecord {
  const record = parseRecord(value, "branding");

  return {
    companyName:
      parseOptionalString(record.company_name, "branding.company_name") ??
      DEFAULT_BRANDING.companyName,
    companyLogoPath: parseOptionalString(
      record.company_logo_path,
      "branding.company_logo_path",
    ),
    loginBackgroundPath: parseOptionalString(
      record.login_background_path,
      "branding.login_background_path",
    ),
    updatedAt: parseOptionalString(record.updated_at, "branding.updated_at"),
  };
}

export async function getBrandingSettings() {
  return apiClient.get<BrandingRecord, BrandingRecord>("/api/v1/branding", {
    parser: parseBrandingRecord,
  });
}

export async function getBrandingResource() {
  return loadApiResource(() => getBrandingSettings(), {
    fallbackData: {
      companyName: DEFAULT_BRANDING.companyName,
      companyLogoPath: null,
      loginBackgroundPath: null,
      updatedAt: null,
    },
    errorMessage: "Unable to load branding settings from the backend.",
  });
}

export function resolveBrandingAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
}
