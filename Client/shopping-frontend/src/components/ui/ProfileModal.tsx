import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Check, Loader2, User, ShieldAlert } from "lucide-react";

interface PresetAvatar {
  id: string;
  name: string;
  url: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    image?: string;
  };
  onProfileUpdated?: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentUser?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.image || "");
  const [presets, setPresets] = useState<PresetAvatar[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser?.name || "");
      setSelectedAvatar(currentUser?.image || "");
      setError("");
      setSuccess(false);

      if (presets.length === 0) {
        setLoadingPresets(true);
        fetch(`${apiBase}/api/auth/presets`)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setPresets(data.presets || []);
            }
          })
          .catch(() => {})
          .finally(() => setLoadingPresets(false));
      }
    }
  }, [isOpen, currentUser, apiBase, presets.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSave() {
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName.trim(),
          avatar: selectedAvatar,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || "Failed to update profile.");
      }

      setSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const currentPreview =
    selectedAvatar ||
    currentUser?.image ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      displayName || currentUser?.email || "Lumora",
    )}&backgroundColor=facc15&textColor=000000&fontWeight=700`;

  // Render via portal directly into document.body — bypasses ALL stacking contexts
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Profile & Avatar"
    >
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl ring-1 ring-black/10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-black"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-black shadow-md shadow-yellow-400/20">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950 sm:text-2xl">
              Profile &amp; Avatar
            </h2>
            <p className="text-xs text-gray-500">
              Personalize your shopper identity and avatar
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-bold">
            <Check size={16} className="shrink-0" strokeWidth={3} />
            <span>Profile saved successfully!</span>
          </div>
        )}

        <div className="mt-5 space-y-5">
          {/* Avatar Live Preview Card */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-yellow-200/70 bg-gradient-to-r from-yellow-50/80 to-amber-50/60 p-3.5">
            <div className="relative shrink-0">
              <img
                src={currentPreview}
                alt="Selected Avatar Preview"
                className="h-14 w-14 rounded-full border-2 border-yellow-400 object-cover shadow-sm ring-2 ring-yellow-400/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=Lumora&backgroundColor=facc15`;
                }}
              />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-gray-950">
                {displayName.trim() || currentUser?.name || "Lumora Shopper"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {currentUser?.email}
              </p>
              <span className="mt-1 inline-block rounded-full bg-yellow-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
                Verified Shopper
              </span>
            </div>
          </div>

          {/* Full Name Input */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <User size={13} className="text-yellow-600" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20"
            />
          </div>

          {/* Preset Avatar Selection Grid */}
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-bold text-gray-800">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-yellow-600" />
                <span>Choose an Avatar Character</span>
              </span>
              <span className="text-[11px] font-normal text-gray-400">
                Tap to pick
              </span>
            </label>

            {loadingPresets ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 size={20} className="animate-spin text-yellow-500" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2.5">
                {presets.map((preset) => {
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.url)}
                      className={`group relative flex flex-col items-center justify-center rounded-2xl border p-2 transition duration-200 ${
                        isSelected
                          ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400 shadow-sm"
                          : "border-gray-100 bg-gray-50/60 hover:border-yellow-300 hover:bg-yellow-50/40"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-11 w-11 rounded-full object-cover transition duration-200 group-hover:scale-110"
                      />
                      <span className="mt-1 max-w-[65px] truncate text-[10px] font-bold text-gray-700">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-black shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-5 py-2.5 text-xs font-black text-black shadow-md shadow-yellow-400/20 transition hover:bg-yellow-500 hover:shadow-lg disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check size={13} strokeWidth={3} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
