// src/components/staff/StaffShell.tsx
//
// Shared chrome for every staff dashboard — one polished header (branded
// icon badge, page title, who's signed in, notifications, sign out)
// instead of each *App.tsx hand-rolling the same plain text row. Pulled
// out once the same "Signed in as X (role) ... Sign Out" markup was found
// duplicated identically across all 5 staff apps.
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useAuthActions } from "../../hooks/useAuthActions";
import { NotificationBell } from "./NotificationBell";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  branch_manager: "Branch Manager",
  cashier: "Cashier",
  waiter: "Waiter",
  chef: "Chef",
  rider: "Rider",
};

interface StaffShellProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function StaffShell({ title, icon: Icon, children }: StaffShellProps) {
  const { user, role } = useAuth();
  const { signOut } = useAuthActions();

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#14100D]/10 bg-white px-5 py-4 shadow-[0_10px_30px_-20px_rgba(20,16,13,0.35)] sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#14100D] text-[#C89A4B]">
            <Icon size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold leading-tight text-[#14100D] sm:text-xl">{title}</h1>
            <p className="text-xs text-[#14100D]/50">
              {user?.fullName ?? "—"}
              {role && (
                <>
                  {" "}
                  <span className="text-[#14100D]/30">·</span>{" "}
                  <span className="font-medium text-[#C89A4B]">{ROLE_LABELS[role] ?? role}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-full border border-[#14100D]/15 px-4 py-2 text-xs font-semibold text-[#14100D] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={14} strokeWidth={2} />
            Sign Out
          </button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        {children}
      </motion.div>
    </div>
  );
}
