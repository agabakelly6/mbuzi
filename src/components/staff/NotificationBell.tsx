// src/components/staff/NotificationBell.tsx
//
// Shared across every staff dashboard (and usable from the customer
// ordering page too — nothing here is staff-specific beyond its folder).
// Live via Realtime; falls back to whatever listForUser returned on mount
// until the first postgres_changes event arrives.
import { useEffect, useRef, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import type { Notification } from "../../types/notification";
import { supabaseNotificationRepository } from "../../repositories/supabase/SupabaseNotificationRepository";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // The panel is `fixed` and anchored to the viewport's right edge, not to
  // this button — the button itself usually isn't the rightmost thing in
  // its header (a Sign Out button sits to its right), so anchoring the
  // panel to the button directly pushed it off-screen to the left on
  // narrow phones. Only the vertical offset is read from the button.
  const [panelTop, setPanelTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
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
        ref={buttonRef}
        type="button"
        onClick={() => {
          setPanelTop((buttonRef.current?.getBoundingClientRect().bottom ?? 0) + 8);
          setIsOpen((prev) => !prev);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#14100D]/15 bg-white text-[#14100D] transition-colors hover:border-[#C89A4B] hover:text-[#C89A4B]"
      >
        {unreadCount > 0 ? <BellRing size={17} strokeWidth={2} /> : <Bell size={17} strokeWidth={2} />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-[#C89A4B] px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{ top: panelTop }}
          className="fixed right-4 z-10 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#14100D]/10 bg-white p-3 shadow-[0_20px_45px_-20px_rgba(20,16,13,0.35)]"
        >
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-[#14100D]/40">Notifications</p>
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
