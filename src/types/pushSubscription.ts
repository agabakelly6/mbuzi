// src/types/pushSubscription.ts
//
// One row per browser a user has enabled real push notifications on —
// the Web Push subscription object PushManager.subscribe() returns,
// shaped for storage. Not an Entity (no updatedAt — a subscription is
// written once and only ever deleted, never edited in place, same
// reasoning as OrderItem).
import type { UUID, ISODateString } from "./base";

export interface PushSubscriptionRecord {
  id: UUID;
  userId: UUID;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: ISODateString;
}
