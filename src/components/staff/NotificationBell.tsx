// src/components/staff/NotificationBell.tsx
//
// Shared across every staff dashboard (and usable from the customer
// ordering page too — nothing here is staff-specific beyond its folder).
// Live via Realtime; falls back to whatever listForUser returned on mount
// until the first postgres_changes event arrives.
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import type { Notification } from "../../types/notification";
import { supabaseNotificationRepository } from "../../repositories/supabase/SupabaseNotificationRepository";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const push = usePushNotifications(user?.id);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    supabaseNotificationRepository.listForUser(user.id).then(({ data }) => {
      if (isMounted && data) setNotifications(data);
    });

    const unsubscribe = supabaseNotificationRepository.subscribe(user.id, (updated) => {
      if (!isMounted) return;
      setNotifications((prev) => (prev.some((n) => n.id === updated.id) ? prev.map((n) => (n.id === updated.id ? updated : n)) : [updated, ...prev]));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  async function handleMarkRead(notification: Notification) {
    const result = await supabaseNotificationRepository.markRead(notification.id);
    if (result.data) setNotifications((prev) => prev.map((n) => (n.id === notification.id ? result.data! : n)));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full border border-[#14100D]/10 bg-white px-4 py-2 text-sm font-semibold text-[#14100D]"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-[#C89A4B] px-2 py-0.5 text-[11px] font-bold text-[#14100D]">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-2xl border border-[#14100D]/10 bg-white p-3 shadow-[0_20px_45px_-20px_rgba(20,16,13,0.25)]">
          {notifications.length === 0 && <p className="p-3 text-sm text-[#14100D]/50">No notifications yet.</p>}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleMarkRead(notification)}
              className={`block w-full rounded-xl p-3 text-left text-sm transition-colors ${
                notification.isRead ? "text-[#14100D]/50" : "bg-[#C89A4B]/10 text-[#14100D]"
              }`}
            >
              <p className="font-semibold">{notification.title}</p>
              <p className="text-xs">{notification.body}</p>
            </button>
          ))}

          {push.state !== "unsupported" && push.state !== "granted" && (
            <div className="mt-2 border-t border-[#14100D]/10 pt-3">
              <button
                type="button"
                onClick={push.enable}
                disabled={push.isEnabling || push.state === "denied"}
                className="w-full rounded-xl bg-[#C89A4B]/10 p-3 text-left text-xs font-semibold text-[#C89A4B] disabled:opacity-60"
              >
                {push.state === "denied"
                  ? "Push notifications blocked — enable them in your browser settings."
                  : push.isEnabling
                    ? "Enabling…"
                    : "Enable push notifications on this device"}
              </button>
              {push.error && <p className="mt-1 px-1 text-xs text-red-600">{push.error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
