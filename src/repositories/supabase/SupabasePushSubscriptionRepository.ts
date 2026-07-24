// src/repositories/supabase/SupabasePushSubscriptionRepository.ts
//
// `save` upserts on (user_id, endpoint) — a browser re-subscribing (e.g.
// after the user cleared permissions and re-granted them) sends the same
// endpoint again, and that should refresh the row, not fail on the unique
// constraint.
import type { PushSubscriptionRepository } from "../PushSubscriptionRepository";
import type { PushSubscriptionRecord } from "../../types/pushSubscription";
import type { RepositoryResult } from "../shared";
import { supabase } from "../../lib/supabase/client";
import { mapDbError } from "../../lib/supabase/dbErrors";
import { mapPushSubscriptionRow, type PushSubscriptionRow } from "../../lib/supabase/mapPushSubscriptionRow";

export const supabasePushSubscriptionRepository: PushSubscriptionRepository = {
  async save(subscription): Promise<RepositoryResult<PushSubscriptionRecord>> {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: subscription.userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        { onConflict: "user_id,endpoint" }
      )
      .select("*")
      .single();
    if (error) return { data: null, error: mapDbError(error) };
    return { data: mapPushSubscriptionRow(data as PushSubscriptionRow), error: null };
  },

  async remove(userId: string, endpoint: string): Promise<RepositoryResult<void>> {
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint);
    if (error) return { data: null, error: mapDbError(error) };
    return { data: null, error: null };
  },
};
