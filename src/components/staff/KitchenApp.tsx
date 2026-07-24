// src/components/staff/KitchenApp.tsx
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { useAuthActions } from "../../hooks/useAuthActions";
import { StaffAuthGate } from "./StaffAuthGate";
import { KitchenDisplay } from "./KitchenDisplay";
import { NotificationBell } from "./NotificationBell";

const ALLOWED_ROLES = ["chef", "branch_manager", "owner"];

function KitchenFlow() {
  useAuthBootstrap();
  const { user, isAuthenticated, role } = useAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) return <StaffAuthGate />;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <p className="mx-auto max-w-md text-center text-sm text-[#14100D]/60">
        This account doesn't have access to the kitchen display.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#14100D]/60">
          Signed in as <span className="font-semibold text-[#14100D]">{user?.fullName}</span> ({role})
        </p>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button type="button" onClick={signOut} className="text-sm font-semibold text-[#C89A4B] underline underline-offset-4">
            Sign Out
          </button>
        </div>
      </div>
      <KitchenDisplay />
    </div>
  );
}

export function KitchenApp() {
  return (
    <AuthProvider>
      <KitchenFlow />
    </AuthProvider>
  );
}
