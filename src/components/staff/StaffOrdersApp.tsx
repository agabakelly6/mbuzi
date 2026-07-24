// src/components/staff/StaffOrdersApp.tsx
//
// Root of the staff order dashboard — its own AuthProvider, entirely
// separate from components/ordering/OrderingApp.tsx's. Accepts
// cashier/waiter/branch_manager/owner; a customer account (or an
// unrecognized role) is turned away, matching the reverse check the
// customer ordering page already does.
import { ClipboardList } from "lucide-react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { StaffAuthGate } from "./StaffAuthGate";
import { StaffShell } from "./StaffShell";
import { AccessDenied } from "./AccessDenied";
import { OrdersDashboard } from "./OrdersDashboard";

const ALLOWED_ROLES = ["cashier", "waiter", "branch_manager", "owner"];

function StaffFlow() {
  useAuthBootstrap();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <StaffAuthGate />;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return <AccessDenied message="This account doesn't have access to the order dashboard." />;
  }

  return (
    <StaffShell title="Order Dashboard" icon={ClipboardList}>
      <OrdersDashboard />
    </StaffShell>
  );
}

export function StaffOrdersApp() {
  return (
    <AuthProvider>
      <StaffFlow />
    </AuthProvider>
  );
}
