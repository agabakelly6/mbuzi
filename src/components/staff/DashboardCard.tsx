// src/components/staff/DashboardCard.tsx
//
// Shared section-card shell (icon + title header, white rounded card)
// used across every staff dashboard so "Promotions", "Orders", "Menu",
// etc. all read as the same visual system instead of each dashboard
// hand-rolling its own <div> wrapper.
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, icon: Icon, action, children, className }: DashboardCardProps) {
  return (
    <div className={`rounded-2xl border border-[#14100D]/10 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(20,16,13,0.4)] sm:p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C89A4B]/12 text-[#C89A4B]">
              <Icon size={16} strokeWidth={2.25} />
            </div>
          )}
          <h2 className="font-serif text-base font-semibold text-[#14100D] sm:text-lg">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
