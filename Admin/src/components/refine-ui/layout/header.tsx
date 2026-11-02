import { useState, useEffect } from "react";
import { useRefineOptions } from "@refinedev/core";
import { useAuth } from "@/providers/auth-context";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import {
  LogOutIcon,
  UserCheck,
  ExternalLink,
  Sparkles,
  Check,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/providers/constants";

export const Header = () => {
  const { isMobile } = useSidebar();
  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-sidebar/80 px-6 backdrop-blur-md",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
        <span className="text-xs font-semibold text-muted-foreground">
          System Live · Lumora Commerce Engine
        </span>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted hover:text-primary md:inline-flex"
        >
          <span>Live Store</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <ThemeToggle />
        <UserDropdown />
      </div>
    </header>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();
  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar pr-3",
      )}
    >
      <SidebarTrigger
        className={cn("ml-1 rotate-180 text-muted-foreground", {
          "opacity-0": open,
          "opacity-100": !open || isMobile,
          "pointer-events-auto": !open || isMobile,
          "pointer-events-none": open && !isMobile,
        })}
      />

      <div
        className={cn(
          "flex h-full flex-row items-center justify-start gap-2 whitespace-nowrap duration-200 transition-discrete",
          {
            "pl-3": !open,
            "pl-5": open,
          },
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm font-bold duration-200 transition-opacity",
            {
              "opacity-0": !open,
              "opacity-100": open,
            },
          )}
        >
          {title.text}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className="h-8 w-8" />
        <UserDropdown />
      </div>
    </header>
  );
}

interface PresetAvatar {
  id: string;
  name: string;
  url: string;
}

const UserDropdown = () => {
  const { authState, user, signOut, updateProfile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [presets, setPresets] = useState<PresetAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.fullName || user.name || "");
      setSelectedAvatar(user.avatar || user.image || "");
    }
  }, [user]);

  useEffect(() => {
    if (profileOpen && presets.length === 0) {
      fetch(`${API_URL}/auth/presets`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setPresets(data.presets || []);
          }
        })
        .catch(() => {});
    }
  }, [profileOpen, presets.length]);

  if (authState !== "signed-in") return null;

  async function handleSaveProfile() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      await updateProfile({
        name: displayName.trim(),
        avatar: selectedAvatar,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setProfileOpen(false);
      }, 900);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  const currentName = user?.fullName || user?.name || "Administrator";
  const currentEmail = user?.email || "admin@lumora.store";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full p-0.5 outline-none transition ring-offset-2 hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Admin account menu"
          >
            <UserAvatar className="h-9 w-9" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64 rounded-2xl border border-border bg-popover p-2 shadow-2xl animate-in fade-in zoom-in-95"
        >
          {/* Header Info */}
          <div className="flex items-center gap-3 border-b border-border/80 px-3 py-3">
            <UserAvatar className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold text-foreground">
                  {currentName}
                </p>
                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-600">
                  Admin
                </span>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {currentEmail}
              </p>
            </div>
          </div>

          <div className="space-y-1 py-1.5 text-xs">
            <DropdownMenuItem
              onClick={() => setProfileOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 font-medium text-foreground transition hover:bg-muted"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Customize Avatar & Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 font-medium text-foreground transition hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span>View Online Store</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Tab ↗</span>
              </a>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => void signOut()}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Admin Profile & Avatar Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Admin Profile & Avatar</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Personalize your administrator persona and avatar badge across the
              system.
            </DialogDescription>
          </DialogHeader>

          {saveError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-600">
              <Check className="h-4 w-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Live Preview */}
            <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-muted/30 p-4">
              <div className="relative">
                <img
                  src={
                    selectedAvatar ||
                    user?.avatar ||
                    user?.image ||
                    "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=facc15"
                  }
                  alt="Avatar preview"
                  className="h-16 w-16 rounded-full border-2 border-primary/30 object-cover shadow-md ring-4 ring-primary/10"
                />
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {displayName.trim() || "Administrator"}
                </p>
                <p className="text-xs text-muted-foreground">{currentEmail}</p>
                <span className="mt-1 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-amber-600">
                  Verified Admin
                </span>
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Christian Cruiser"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Preset Avatars Selection Grid */}
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Choose an Avatar Preset
              </label>
              <div className="grid grid-cols-4 gap-3">
                {presets.map((preset) => {
                  const isSelected = selectedAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.url)}
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-2xl border p-2 transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                          : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-12 w-12 rounded-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <span className="mt-1.5 max-w-[65px] truncate text-[10px] font-medium text-muted-foreground">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save / Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveProfile()}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";
