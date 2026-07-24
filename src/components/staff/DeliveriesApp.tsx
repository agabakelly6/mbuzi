// src/components/staff/DeliveriesApp.tsx
import { Truck } from "lucide-react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { StaffAuthGate } from "./StaffAuthGate";
import { StaffShell } from "./StaffShell";
import { AccessDenied } from "./AccessDenied";
import { DeliveriesDashboard } from "./DeliveriesDashboard";

const ALLOWED_ROLES = ["rider", "branch_manager", "owner"];

function DeliveriesFlow() {
  useAuthBootstrap();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <StaffAuthGate />;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return <AccessDenied message="This account doesn't have access to the deliveries dashboard." />;
  }

  return (
    <StaffShell title="Deliveries" icon={Truck}>
      <DeliveriesDashboard />
    </StaffShell>
  );
}

export function DeliveriesApp() {
  return (
    <AuthProvider>
      <DeliveriesFlow />
    </AuthProvider>
  );
}
