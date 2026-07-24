// src/repositories/supabase/SupabaseNotificationRepository.ts
//
// `create()` only succeeds for an owner — notifications has no non-owner
// INSERT policy by design. The real creation paths are the
// on_order_ready/on_delivery_assigned DB triggers (see the notifications
// migration); this repository's job is reading and marking read, not
// generating them.
import type { NotificationRepository } from "../NotificationRepository";
import type { Notification } from "../../types/notification";
import type { RepositoryResult, Unsubscribe } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { dbError, mapDbError } from "../../lib/supabase/dbErrors";
import { mapNotificationRow, type NotificationRow } from "../../lib/supabase/mapNotificationRow";

export const supabaseNotificationRepository: NotificationRepository = {
  async listForUser(userId: string, unreadOnly?: boolean): Promise<RepositoryResult<Notification[]>> {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false });
    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) return { data: null, error: mapDbError(error) };
    return { data: ((data ?? []) as NotificationRow[]).map(mapNotificationRow), error: null };
  },

  async create(notification): Promise<RepositoryResult<Notification>> {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        recipient_user_id: notification.recipientUserId,
        branch_id: notification.branchId ?? null,
        type: notification.type,
        channel: notification.channel,
        title: notification.title,
        body: notification.body,
        related_entity_id: notification.relatedEntityId ?? null,
        sent_at: notification.sentAt ?? null,
      })
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapNotificationRow(data as NotificationRow), error: null };
  },

  async markRead(id: string): Promise<RepositoryResult<Notification>> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return { data: null, error: mapDbError(error) };
    if (!data) return { data: null, error: dbError("not_found") };
    return { data: mapNotificationRow(data as NotificationRow), error: null };
  },

  async markAllRead(userId: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("recipient_user_id", userId).eq("is_read", false);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },

  subscribe(userId: string, onChange: (notification: Notification) => void): Unsubscribe {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as NotificationRow | null;
          if (row) onChange(mapNotificationRow(row));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
