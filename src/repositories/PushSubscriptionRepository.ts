// src/repositories/PushSubscriptionRepository.ts
import type { PushSubscriptionRecord } from "../types/pushSubscription";
import type { RepositoryResult } from "./shared";

export interface PushSubscriptionRepository {
  save(subscription: Omit<PushSubscriptionRecord, "id" | "createdAt">): Promise<RepositoryResult<PushSubscriptionRecord>>;
  remove(userId: string, endpoint: string): Promise<RepositoryResult<void>>;
}
