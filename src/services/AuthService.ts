// src/services/AuthService.ts
//
// Interfaces only — no implementation. Phase 3 provides a Supabase Auth-
// backed implementation of this exact contract; contexts/AuthContext.tsx
// and every hook built on it depend only on this interface.
import type { AuthSession, User } from "../types/user";
import type { RepositoryResult } from "../repositories/shared";
import type { SignInInput, SignUpStaffInput } from "../validators/user.schema";

export interface AuthService {
  signInWithPassword(input: SignInInput): Promise<RepositoryResult<AuthSession>>;
  signInWithOtp(phone: string): Promise<RepositoryResult<{ challengeId: string }>>;
  verifyOtp(challengeId: string, code: string): Promise<RepositoryResult<AuthSession>>;
  inviteStaff(input: SignUpStaffInput): Promise<RepositoryResult<User>>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<RepositoryResult<User | null>>;
  refreshSession(refreshToken: string): Promise<RepositoryResult<AuthSession>>;
}
