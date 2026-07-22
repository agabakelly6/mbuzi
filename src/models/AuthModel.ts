// src/models/AuthModel.ts
import type { AuthFlowState } from "../lib/state-machines";
import { canTransitionAuthFlow } from "../lib/state-machines";
import type { User } from "../types/user";

export function canTransitionAuth(from: AuthFlowState, to: AuthFlowState): boolean {
  return canTransitionAuthFlow(from, to);
}

/** A "signed in" User with a suspended/deactivated account should still fail the auth check even with a technically valid session — this is what contexts/AuthContext.tsx's `authenticated` state should actually gate on, not just "a session token exists." */
export function isActiveUser(user: User): boolean {
  return user.status === "active";
}
