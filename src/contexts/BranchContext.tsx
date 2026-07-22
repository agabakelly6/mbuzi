// src/contexts/BranchContext.tsx
//
// The "which branch am I looking at" boundary — a staff member's screens
// (orders board, kitchen display, table map) all scope to whichever Branch
// is current here. For staff this is normally fixed to their own
// User.branchId on login; for an owner switching between branches, this is
// what a branch picker in the UI would update.
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Branch } from "../types/branch";

export interface BranchContextValue {
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);

  return (
    <BranchContext.Provider value={{ currentBranch, setCurrentBranch }}>{children}</BranchContext.Provider>
  );
}

export function useBranchContext(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranchContext must be used within a BranchProvider");
  return ctx;
}
