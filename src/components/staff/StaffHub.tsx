// src/components/staff/StaffHub.tsx
//
// Single staff entry point (/staff) — one URL to bookmark/share instead of
// five. Signs in via the same StaffAuthGate every other staff page uses,
// then redirects to the dashboard matching the signed-in account's role.
// branch_manager/owner land on /staff/branch (their own control panel) by
// default rather than /staff/orders — the more natural "home" for a role
// that can reach every dashboard, not just one.
import { useEffect } from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { useAuth } from "../../hooks/useAuth";
import { useAuthBootstrap } from "../../hooks/useAuthBootstrap";
import { StaffAuthGate } from "./StaffAuthGate";
import type { RoleName } from "../../types/role";

const ROLE_DESTINATIONS: Partial<Record<RoleName, string>> = {
  cashier: "/staff/orders",
  waiter: "/staff/orders",
  chef: "/staff/kitchen",
  rider: "/staff/deliveries",
  branch_manager: "/staff/branch",
  owner: "/staff/branch",
};

function StaffHubFlow() {
  useAuthBootstrap();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !role) return;
    const destination = ROLE_DESTINATIONS[role];
    if (destination) window.location.href = destination;
  }, [isAuthenticated, role]);

  if (!isAuthenticated) {
    return <StaffAuthGate />;
  }

  if (!role || !ROLE_DESTINATIONS[role]) {
    return (
      <p className="mx-auto max-w-md text-center text-sm text-[#14100D]/60">
        This account doesn't have access to any staff dashboard.
      </p>
    );
  }

  return <p className="text-center text-sm text-[#14100D]/60">Redirecting…</p>;
}

export function StaffHub() {
  return (
    <AuthProvider>
      <StaffHubFlow />
    </AuthProvider>
  );
}
