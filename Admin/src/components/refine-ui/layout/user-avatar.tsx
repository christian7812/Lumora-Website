import { useGetIdentity } from "@refinedev/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, type AdminUser } from "@/providers/auth-context";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  showOnlineStatus?: boolean;
}

export function UserAvatar({
  className,
  showOnlineStatus = true,
}: UserAvatarProps) {
  const { data: identityUser, isLoading: userIsLoading } =
    useGetIdentity<AdminUser>();
  const { user: authContextUser } = useAuth();

  const user = identityUser || authContextUser;

  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Admin");
  const avatarUrl = user?.avatar || user?.image;
  const initials = getInitials(displayName);

  return (
    <div className="relative inline-flex items-center justify-center">
      <Avatar
        className={cn(
          "h-10 w-10 border-2 border-primary/20 shadow-sm transition-transform duration-200 hover:scale-105",
          className,
        )}
      >
        {avatarUrl ? (
          <AvatarImage
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-gradient-to-tr from-amber-400 to-yellow-500 font-black text-black">
          {initials}
        </AvatarFallback>
      </Avatar>

      {showOnlineStatus && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background"
          title="Online"
        />
      )}
    </div>
  );
}

const getInitials = (name = "") => {
  const names = name.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) return "AD";
  let initials = names[0].substring(0, 1).toUpperCase();

  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials.slice(0, 2);
};

UserAvatar.displayName = "UserAvatar";
