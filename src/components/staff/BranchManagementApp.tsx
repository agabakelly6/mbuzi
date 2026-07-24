// src/components/staff/BranchManagementApp.tsx
import { LayoutGrid } from "lucide-react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { StaffAuthGate } from "./StaffAuthGate";
import { StaffShell } from "./StaffShell";
import { AccessDenied } from "./AccessDenied";
import { BranchManagementDashboard } from "./BranchManagementDashboard";

const ALLOWED_ROLES = ["branch_manager", "owner"];

function BranchManagementFlow() {
  useAuthBootstrap();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <StaffAuthGate />;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return <AccessDenied message="This account doesn't have access to branch management." />;
  }

  return (
    <StaffShell title="Branch Management" icon={LayoutGrid}>
      <BranchManagementDashboard />
    </StaffShell>
  );
}

export function BranchManagementApp() {
  return (
    <AuthProvider>
      <BranchManagementFlow />
    </AuthProvider>
  );
}
