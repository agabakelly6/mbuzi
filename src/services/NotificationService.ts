// src/services/NotificationService.ts
import type { Notification } from "../types/notification";
import type { RepositoryResult } from "../repositories/shared";
import type { CreateNotificationInput } from "../validators/notification.schema";

export interface NotificationService {
  send(input: CreateNotificationInput): Promise<RepositoryResult<Notification>>;
  listForUser(userId: string, unreadOnly?: boolean): Promise<RepositoryResult<Notification[]>>;
  markRead(id: string): Promise<RepositoryResult<Notification>>;
}
