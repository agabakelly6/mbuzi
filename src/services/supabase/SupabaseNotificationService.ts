// src/services/supabase/SupabaseNotificationService.ts
import type { NotificationService } from "../NotificationService";
import { dbError } from "../../lib/supabase/dbErrors";
import { supabaseNotificationRepository } from "../../repositories/supabase/SupabaseNotificationRepository";

export const supabaseNotificationService: NotificationService = {
  async send(input) {
    // Only succeeds for an owner session — see SupabaseNotificationRepository's
    // header comment. Real notifications come from the DB triggers, not this.
    if (!input.recipientUserId) return { data: null, error: dbError("validation_error") };
    return supabaseNotificationRepository.create({
      recipientUserId: input.recipientUserId,
      branchId: input.branchId,
      type: input.type,
      channel: input.channel,
      title: input.title,
      body: input.body,
      relatedEntityId: input.relatedEntityId,
    });
  },

  async listForUser(userId, unreadOnly) {
    return supabaseNotificationRepository.listForUser(userId, unreadOnly);
  },

  async markRead(id) {
    return supabaseNotificationRepository.markRead(id);
  },
};
