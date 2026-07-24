// src/components/staff/KitchenApp.tsx
import { ChefHat } from "lucide-react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { StaffAuthGate } from "./StaffAuthGate";
import { StaffShell } from "./StaffShell";
import { AccessDenied } from "./AccessDenied";
import { KitchenDisplay } from "./KitchenDisplay";

const ALLOWED_ROLES = ["chef", "branch_manager", "owner"];

function KitchenFlow() {
  useAuthBootstrap();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <StaffAuthGate />;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return <AccessDenied message="This account doesn't have access to the kitchen display." />;
  }

  return (
    <StaffShell title="Kitchen Display" icon={ChefHat}>
      <KitchenDisplay />
    </StaffShell>
  );
}

export function KitchenApp() {
  return (
    <AuthProvider>
      <KitchenFlow />
    </AuthProvider>
  );
}
