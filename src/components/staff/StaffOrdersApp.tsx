// src/components/staff/StaffOrdersApp.tsx
//
// Root of the staff order dashboard — its own AuthProvider, entirely
// separate from components/ordering/OrderingApp.tsx's. Accepts
// cashier/waiter/branch_manager/owner; a customer account (or an
// unrecognized role) is turned away, matching the reverse check the
// customer ordering page already does.
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { useAuthActions } from "../../hooks/useAuthActions";
import { StaffAuthGate } from "./StaffAuthGate";
import { OrdersDashboard } from "./OrdersDashboard";
import { NotificationBell } from "./NotificationBell";

const ALLOWED_ROLES = ["cashier", "waiter", "branch_manager", "owner"];

function StaffFlow() {
  useAuthBootstrap();
  const { user, isAuthenticated, role } = useAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return <StaffAuthGate />;
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <p className="mx-auto max-w-md text-center text-sm text-[#14100D]/60">
        This account doesn't have access to the order dashboard.
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
      <OrdersDashboard />
    </div>
  );
}

export function StaffOrdersApp() {
  return (
    <AuthProvider>
      <StaffFlow />
    </AuthProvider>
  );
}
