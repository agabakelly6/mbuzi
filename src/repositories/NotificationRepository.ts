// src/repositories/NotificationRepository.ts
import type { Notification } from "../types/notification";
import type { RepositoryResult, Unsubscribe } from "./shared";

export interface NotificationRepository {
  listForUser(userId: string, unreadOnly?: boolean): Promise<RepositoryResult<Notification[]>>;
  create(notification: Omit<Notification, "id" | "createdAt" | "updatedAt" | "isRead">): Promise<RepositoryResult<Notification>>;
  markRead(id: string): Promise<RepositoryResult<Notification>>;
  markAllRead(userId: string): Promise<RepositoryResult<void>>;
  /** Live feed powering an in-app notification bell. */
  subscribe(userId: string, onChange: (notification: Notification) => void): Unsubscribe;
}
