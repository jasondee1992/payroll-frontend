import { getApiBaseUrl } from "@/lib/api/config";
import { parseNumber, parseRecord, parseString } from "@/lib/api/parsers";
import { handleUnauthorizedClientResponse } from "@/lib/auth/client-auth";

export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_OPTIMIZED_MAX_DIMENSION = 640;
const PROFILE_IMAGE_OPTIMIZED_QUALITY = 0.82;
export const PROFILE_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type UserProfileRecord = {
  user_id: number;
  username: string;
  email: string;
  role: string;
  employee_id: number | null;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  department: string | null;
  contact_number: string | null;
  profile_image_path: string | null;
  profile_image_url: string | null;
};

export type UserProfileUpdatePayload = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username?: string | null;
  contact_number?: string | null;
};

type UploadProfileImageOptions = {
  skipOptimization?: boolean;
};

function parseOptionalString(value: unknown, label: string) {
  return parseString(value, label, { optional: true }) ?? null;
}

function resolveProfileImageUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl}${value}` : value;
}

export function parseUserProfileRecord(value: unknown): UserProfileRecord {
  const record = parseRecord(value, "user profile");
  const profileImagePath = parseOptionalString(
    record.profile_image_path,
    "userProfile.profile_image_path",
  );
  const profileImageUrl = parseOptionalString(
    record.profile_image_url,
    "userProfile.profile_image_url",
  );

  return {
    user_id: parseNumber(record.user_id, "userProfile.user_id"),
    username: parseString(record.username, "userProfile.username"),
    email: parseString(record.email, "userProfile.email"),
    role: parseString(record.role, "userProfile.role"),
    employee_id:
      record.employee_id == null
        ? null
        : parseNumber(record.employee_id, "userProfile.employee_id"),
    employee_code: parseOptionalString(
      record.employee_code,
      "userProfile.employee_code",
    ),
    first_name: parseOptionalString(
      record.first_name,
      "userProfile.first_name",
    ),
    last_name: parseOptionalString(
      record.last_name,
      "userProfile.last_name",
    ),
    full_name: parseString(record.full_name, "userProfile.full_name"),
    department: parseOptionalString(
      record.department,
      "userProfile.department",
    ),
    contact_number: parseOptionalString(
      record.contact_number,
      "userProfile.contact_number",
    ),
    profile_image_path: profileImagePath,
    profile_image_url: resolveProfileImageUrl(profileImageUrl ?? profileImagePath),
  };
}

function getProfileErrorMessage(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
  ) {
    if (
      "error" in responseBody &&
      typeof responseBody.error === "string" &&
      responseBody.error.trim().length > 0
    ) {
      return responseBody.error;
    }

    if (
      "detail" in responseBody &&
      typeof responseBody.detail === "string" &&
      responseBody.detail.trim().length > 0
    ) {
      return responseBody.detail;
    }
  }

  if (typeof responseBody === "string" && responseBody.trim().length > 0) {
    return responseBody;
  }

  return "Unable to process the profile request.";
}

export async function getCurrentUserProfile() {
  const response = await fetch("/api/profile", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getProfileErrorMessage(responseBody));
  }

  return parseUserProfileRecord(responseBody);
}

export async function updateCurrentUserProfile(
  payload: UserProfileUpdatePayload,
) {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getProfileErrorMessage(responseBody));
  }

  return parseUserProfileRecord(responseBody);
}

export async function uploadCurrentUserProfileImage(
  file: File,
  options?: UploadProfileImageOptions,
) {
  const validationError = validateProfileImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const optimizedFile = options?.skipOptimization
    ? file
    : await optimizeProfileImageFile(file);
  const formData = new FormData();
  formData.append("image", optimizedFile, optimizedFile.name);

  const response = await fetch("/api/profile/image", {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (await handleUnauthorizedClientResponse(response)) {
    throw new Error("Your session has expired. Redirecting to login.");
  }

  if (!response.ok) {
    throw new Error(getProfileErrorMessage(responseBody));
  }

  return parseUserProfileRecord(responseBody);
}

export function validateProfileImageFile(file: File) {
  if (!PROFILE_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof PROFILE_IMAGE_ALLOWED_TYPES)[number])) {
    return "Profile image must be a JPG, PNG, or WEBP file.";
  }

  if (file.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
    return "Profile image must not exceed 5 MB.";
  }

  return null;
}

async function optimizeProfileImageFile(file: File) {
  try {
    const image = await loadImageElement(file);
    const { width, height } = getScaledDimensions(image.width, image.height);

    if (!width || !height) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const optimizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", PROFILE_IMAGE_OPTIMIZED_QUALITY);
    });

    if (!optimizedBlob) {
      return file;
    }

    return new File(
      [optimizedBlob],
      replaceFileExtension(file.name, ".webp"),
      { type: "image/webp" },
    );
  } catch {
    return file;
  }
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = window.URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      window.URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      window.URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to load image for optimization."));
    };
    image.src = imageUrl;
  });
}

function getScaledDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }

  const largestSide = Math.max(width, height);
  if (largestSide <= PROFILE_IMAGE_OPTIMIZED_MAX_DIMENSION) {
    return { width, height };
  }

  const scale = PROFILE_IMAGE_OPTIMIZED_MAX_DIMENSION / largestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function replaceFileExtension(filename: string, nextExtension: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${filename}${nextExtension}`;
  }

  return `${filename.slice(0, lastDotIndex)}${nextExtension}`;
}
