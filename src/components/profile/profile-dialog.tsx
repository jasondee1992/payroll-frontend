"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, Upload, X } from "lucide-react";
import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  type UserProfileRecord,
  updateCurrentUserProfile,
  uploadCurrentUserProfileImage,
  validateProfileImageFile,
} from "@/lib/api/profile";

type ProfileDialogProps = {
  open: boolean;
  profile: UserProfileRecord | null;
  isLoadingProfile: boolean;
  profileErrorMessage: string | null;
  onClose: () => void;
  onRefreshProfile: () => Promise<void>;
  onProfileUpdated: (profile: UserProfileRecord) => void;
};

type ProfileFormState = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  contactNumber: string;
};

type CropOffset = {
  x: number;
  y: number;
};

const PROFILE_IMAGE_ACCEPT = PROFILE_IMAGE_ALLOWED_TYPES.join(",");
const PROFILE_CROP_VIEW_SIZE = 224;
const PROFILE_CROP_OUTPUT_SIZE = 512;
const PROFILE_CROP_MIN_ZOOM = 1;
const PROFILE_CROP_MAX_ZOOM = 3;

export function ProfileDialog({
  open,
  profile,
  isLoadingProfile,
  profileErrorMessage,
  onClose,
  onRefreshProfile,
  onProfileUpdated,
}: ProfileDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>(() =>
    createProfileFormState(profile),
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [cropImageSize, setCropImageSize] = useState<{ width: number; height: number } | null>(null);
  const [dragState, setDragState] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState(createProfileFormState(profile));
    setSelectedFile(null);
    setPreviewUrl(null);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropImageSize(null);
    setDragState(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [open, profile]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!selectedFile) {
      setCropImageSize(null);
      return;
    }

    let isCancelled = false;

    void loadImageDimensions(selectedFile).then((dimensions) => {
      if (isCancelled) {
        return;
      }

      setCropImageSize(dimensions);
    }).catch(() => {
      if (!isCancelled) {
        setCropImageSize(null);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedFile]);

  const displayName = useMemo(() => {
    const parts = [formState.firstName.trim(), formState.lastName.trim()].filter(Boolean);
    return parts.join(" ") || profile?.full_name || profile?.username || "My Profile";
  }, [formState.firstName, formState.lastName, profile?.full_name, profile?.username]);

  const currentImageUrl = previewUrl ?? profile?.profile_image_url ?? null;
  const cropBounds = cropImageSize
    ? getCropBounds(cropImageSize, cropZoom)
    : null;
  const isDirty =
    Boolean(selectedFile) ||
    formState.firstName !== (profile?.first_name ?? "") ||
    formState.lastName !== (profile?.last_name ?? "") ||
    formState.email !== profile?.email ||
    formState.username !== profile?.username ||
    formState.contactNumber !== (profile?.contact_number ?? "");

  if (!open || !mounted) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      setErrorMessage("Profile data is not ready yet. Try again.");
      return;
    }

    if (!formState.email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }

    if (!formState.username.trim()) {
      setErrorMessage("Username is required.");
      return;
    }

    if (!formState.firstName.trim() && !formState.lastName.trim()) {
      setErrorMessage("Add at least a first name or last name.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let nextProfile = await updateCurrentUserProfile({
        first_name: normalizeTextField(formState.firstName),
        last_name: normalizeTextField(formState.lastName),
        email: formState.email.trim(),
        username: formState.username.trim(),
        contact_number: normalizeTextField(formState.contactNumber),
      });

      if (selectedFile) {
        const croppedFile = await createCroppedProfileImage({
          file: selectedFile,
          zoom: cropZoom,
          offset: cropOffset,
          imageSize: cropImageSize,
        });
        nextProfile = await uploadCurrentUserProfileImage(croppedFile, {
          skipOptimization: true,
        });
      }

      onProfileUpdated(nextProfile);
      setFormState(createProfileFormState(nextProfile));
      setSelectedFile(null);
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropImageSize(null);
      setDragState(null);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the profile right now.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleFieldChange(field: keyof ProfileFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleReset() {
    setFormState(createProfileFormState(profile));
    setSelectedFile(null);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setCropImageSize(null);
    setDragState(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    const validationError = validateProfileImageFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(window.URL.createObjectURL(file));
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleCropZoomChange(nextZoomValue: number) {
    const normalizedZoom = clamp(nextZoomValue, PROFILE_CROP_MIN_ZOOM, PROFILE_CROP_MAX_ZOOM);
    setCropZoom(normalizedZoom);
    setCropOffset((current) => clampCropOffset(current, cropImageSize, normalizedZoom));
  }

  function handleCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropImageSize || !cropBounds) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: cropOffset.x,
      originY: cropOffset.y,
    });
  }

  function handleCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || !cropBounds) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setCropOffset(
      clampCropOffset(
        {
          x: dragState.originX + deltaX,
          y: dragState.originY + deltaY,
        },
        cropImageSize,
        cropZoom,
      ),
    );
  }

  function handleCropPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragState(null);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/50 p-3 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="my-auto flex h-[min(860px,calc(100vh-1.5rem))] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/20 sm:h-[min(860px,calc(100vh-3rem))]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-950">My Profile</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Update your account details and profile picture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            aria-label="Close profile dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoadingProfile && !profile ? (
          <div className="px-5 py-10 sm:px-6">
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center text-sm leading-6 text-slate-500">
              Loading profile...
            </div>
          </div>
        ) : profileErrorMessage && !profile ? (
          <div className="px-5 py-10 sm:px-6">
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm leading-6 text-rose-700">
              <p>{profileErrorMessage}</p>
              <button
                type="button"
                onClick={() => void onRefreshProfile()}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
              >
                Retry loading profile
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
                <section className="space-y-4">
                  <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Account snapshot
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <ProfileAvatar
                        imageUrl={currentImageUrl}
                        displayName={displayName}
                        className="h-20 w-20 rounded-[24px] text-2xl"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-950">
                          {displayName}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {formatRoleLabel(profile?.role ?? null) ?? "Account"}
                        </p>
                        <p className="mt-2 truncate text-xs text-slate-500">
                          {profile?.email ?? "No email available"}
                        </p>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={PROFILE_IMAGE_ACCEPT}
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      <Upload className="h-4 w-4" />
                      {selectedFile ? "Change picture" : "Upload picture"}
                    </button>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      JPG, PNG, or WEBP up to{" "}
                      {Math.round(PROFILE_IMAGE_MAX_SIZE_BYTES / (1024 * 1024))} MB.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Large photos are resized automatically for profile use.
                    </p>
                    {selectedFile ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Ready to upload: {selectedFile.name}
                      </p>
                    ) : null}
                  </div>

                  {previewUrl && cropImageSize ? (
                    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Profile photo crop
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Drag the photo to reposition it, then use zoom to fit the avatar.
                      </p>

                      <div className="mt-4 flex justify-center">
                        <div
                          className="relative h-56 w-56 touch-none overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-inner"
                          onPointerDown={handleCropPointerDown}
                          onPointerMove={handleCropPointerMove}
                          onPointerUp={handleCropPointerUp}
                          onPointerCancel={handleCropPointerUp}
                        >
                          <div
                            className="absolute cursor-grab active:cursor-grabbing"
                            style={{
                              backgroundImage: `url(${previewUrl})`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center center",
                              backgroundSize: "100% 100%",
                              width: cropBounds?.width ?? PROFILE_CROP_VIEW_SIZE,
                              height: cropBounds?.height ?? PROFILE_CROP_VIEW_SIZE,
                              left: "50%",
                              top: "50%",
                              transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px))`,
                            }}
                          />
                          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-slate-200/80" />
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          <span>Zoom</span>
                          <span>{cropZoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min={PROFILE_CROP_MIN_ZOOM}
                          max={PROFILE_CROP_MAX_ZOOM}
                          step="0.01"
                          value={cropZoom}
                          onChange={(event) => handleCropZoomChange(Number(event.target.value))}
                          className="w-full accent-slate-900"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[28px] border border-slate-200/80 bg-white p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Reference details
                    </p>
                    <div className="mt-4 space-y-4">
                      <ReadOnlyItem label="Full name" value={displayName} />
                      <ReadOnlyItem
                        label="Employee ID"
                        value={profile?.employee_code ?? "Not linked"}
                      />
                      <ReadOnlyItem
                        label="Role"
                        value={formatRoleLabel(profile?.role ?? null) ?? "Unknown"}
                      />
                      <ReadOnlyItem
                        label="Department"
                        value={profile?.department ?? "Not assigned"}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-5">
                  {(errorMessage || successMessage) && (
                    <div
                      className={
                        errorMessage
                          ? "rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
                          : "rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700"
                      }
                    >
                      {errorMessage ?? successMessage}
                    </div>
                  )}

                  <div className="rounded-[28px] border border-slate-200/80 bg-white p-5">
                    <div className="border-b border-slate-200/80 pb-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Editable profile details
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        These details are used for your account display and internal profile records.
                      </p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <FieldGroup
                        label="First name"
                        value={formState.firstName}
                        onChange={(value) => handleFieldChange("firstName", value)}
                        placeholder="Enter first name"
                      />
                      <FieldGroup
                        label="Last name"
                        value={formState.lastName}
                        onChange={(value) => handleFieldChange("lastName", value)}
                        placeholder="Enter last name"
                      />
                      <FieldGroup
                        label="Email"
                        type="email"
                        value={formState.email}
                        onChange={(value) => handleFieldChange("email", value)}
                        placeholder="name@company.com"
                      />
                      <FieldGroup
                        label="Username"
                        value={formState.username}
                        onChange={(value) => handleFieldChange("username", value)}
                        placeholder="Username"
                      />
                      <FieldGroup
                        label="Contact number"
                        value={formState.contactNumber}
                        onChange={(value) => handleFieldChange("contactNumber", value)}
                        placeholder="09XXXXXXXXX"
                      />
                      <ReadOnlyField
                        label="Role"
                        value={formatRoleLabel(profile?.role ?? null) ?? "Unknown"}
                      />
                      <ReadOnlyField
                        label="Employee ID"
                        value={profile?.employee_code ?? "Not linked"}
                      />
                      <ReadOnlyField
                        label="Department"
                        value={profile?.department ?? "Not assigned"}
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-5">
                    <p className="text-sm font-semibold text-slate-950">Save changes</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Changes are saved to your account profile and reflected in the header avatar.
                    </p>

                    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={!isDirty || isSaving}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving || !isDirty}
                        className="ui-button-primary h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          "Save changes"
                        )}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </form>
          </div>
        )}
      </div>
      </div>
    </div>
    ,
    document.body,
  );
}

function createProfileFormState(profile: UserProfileRecord | null): ProfileFormState {
  return {
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    email: profile?.email ?? "",
    username: profile?.username ?? "",
    contactNumber: profile?.contact_number ?? "",
  };
}

function normalizeTextField(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function ProfileAvatar({
  imageUrl,
  displayName,
  className,
}: {
  imageUrl: string | null;
  displayName: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={displayName}
        width={112}
        height={112}
        unoptimized
        className={className ?? "h-10 w-10 rounded-full object-cover"}
      />
    );
  }

  return (
    <div
      className={`${className ?? "h-10 w-10 rounded-full"} flex items-center justify-center bg-slate-900 font-semibold text-white`}
    >
      {getInitials(displayName)}
    </div>
  );
}

function FieldGroup({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ui-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="ui-input"
        placeholder={placeholder}
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ui-label">{label}</span>
      <div className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600">
        {value}
      </div>
    </label>
  );
}

function ReadOnlyItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
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

function formatRoleLabel(value: string | null) {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampCropOffset(
  offset: CropOffset,
  imageSize: { width: number; height: number } | null,
  zoom: number,
) {
  const bounds = imageSize ? getCropBounds(imageSize, zoom) : null;

  if (!bounds) {
    return { x: 0, y: 0 };
  }

  const maxX = Math.max(0, (bounds.width - PROFILE_CROP_VIEW_SIZE) / 2);
  const maxY = Math.max(0, (bounds.height - PROFILE_CROP_VIEW_SIZE) / 2);

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

function getCropBounds(
  imageSize: { width: number; height: number },
  zoom: number,
) {
  const baseScale = Math.max(
    PROFILE_CROP_VIEW_SIZE / imageSize.width,
    PROFILE_CROP_VIEW_SIZE / imageSize.height,
  );
  const scale = baseScale * zoom;

  return {
    width: imageSize.width * scale,
    height: imageSize.height * scale,
    scale,
  };
}

async function loadImageDimensions(file: File) {
  const image = await loadFileImage(file);

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

async function createCroppedProfileImage({
  file,
  zoom,
  offset,
  imageSize,
}: {
  file: File;
  zoom: number;
  offset: CropOffset;
  imageSize: { width: number; height: number } | null;
}) {
  const image = await loadFileImage(file);
  const dimensions = imageSize ?? {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
  const bounds = getCropBounds(dimensions, zoom);
  const scaleFactor = PROFILE_CROP_OUTPUT_SIZE / PROFILE_CROP_VIEW_SIZE;
  const drawWidth = bounds.width * scaleFactor;
  const drawHeight = bounds.height * scaleFactor;
  const drawX =
    (PROFILE_CROP_OUTPUT_SIZE - drawWidth) / 2 + offset.x * scaleFactor;
  const drawY =
    (PROFILE_CROP_OUTPUT_SIZE - drawHeight) / 2 + offset.y * scaleFactor;

  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_CROP_OUTPUT_SIZE;
  canvas.height = PROFILE_CROP_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.arc(
    PROFILE_CROP_OUTPUT_SIZE / 2,
    PROFILE_CROP_OUTPUT_SIZE / 2,
    PROFILE_CROP_OUTPUT_SIZE / 2,
    0,
    Math.PI * 2,
  );
  context.closePath();
  context.clip();
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.9);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], replaceFileExtension(file.name, ".webp"), {
    type: "image/webp",
  });
}

function loadFileImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imageUrl = window.URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      window.URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      window.URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to load profile image."));
    };
    image.src = imageUrl;
  });
}

function replaceFileExtension(filename: string, nextExtension: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${filename}${nextExtension}`;
  }

  return `${filename.slice(0, lastDotIndex)}${nextExtension}`;
}
