// src/components/staff/ReservationsApp.tsx
import { CalendarCheck } from "lucide-react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { StaffAuthGate } from "./StaffAuthGate";
import { StaffShell } from "./StaffShell";
import { AccessDenied } from "./AccessDenied";
import { ReservationsDashboard } from "./ReservationsDashboard";

const ALLOWED_ROLES = ["cashier", "branch_manager", "owner"];

function ReservationsFlow() {
  useAuthBootstrap();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <StaffAuthGate />;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return <AccessDenied message="This account doesn't have access to reservations." />;
  }

  return (
    <StaffShell title="Reservations" icon={CalendarCheck}>
      <ReservationsDashboard />
    </StaffShell>
  );
}

export function ReservationsApp() {
  return (
    <AuthProvider>
      <ReservationsFlow />
    </AuthProvider>
  );
}
