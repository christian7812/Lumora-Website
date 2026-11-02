import { useGetIdentity } from "@refinedev/core";
import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { useAuth, type AdminUser } from "@/providers/auth-context";
import { cn } from "@/lib/utils";

export function UserInfo() {
  const { data: identityUser } = useGetIdentity<AdminUser>();
  const { user: authUser } = useAuth();

  const user = identityUser || authUser;

  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : "Admin");
  const email = user?.email || "admin@lumora.store";

  return (
    <div className={cn("flex items-center gap-x-3")}>
      <UserAvatar />
      <div className={cn("flex flex-col justify-between text-left")}>
        <span className={cn("text-xs font-bold leading-tight text-foreground")}>
          {displayName}
        </span>
        <span className={cn("text-[11px] leading-tight text-muted-foreground truncate max-w-[140px]")}>
          {email}
        </span>
      </div>
    </div>
  );
}

UserInfo.displayName = "UserInfo";
