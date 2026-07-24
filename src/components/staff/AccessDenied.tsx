// src/components/staff/AccessDenied.tsx
//
// Replaces the plain "This account doesn't have access to..." text every
// staff *App.tsx showed for a signed-in-but-wrong-role account.
import { ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  message: string;
}

export function AccessDenied({ message }: AccessDeniedProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[#14100D]/10 bg-white p-10 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <ShieldAlert size={22} strokeWidth={2} />
      </div>
      <p className="text-sm text-[#14100D]/60">{message}</p>
    </div>
  );
}
