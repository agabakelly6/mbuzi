// public/sw.js
//
// Minimal service worker whose only job is showing a push notification —
// no offline caching, no asset interception. Registered from
// hooks/usePushNotifications.ts, scoped to the whole site ("/") since it
// must be served from the root to receive pushes for any staff dashboard
// path.
self.addEventListener("push", (event) => {
  let payload = { title: "New notification", body: "" };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    // Non-JSON push payload — fall back to the default above rather than failing silently.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: { url: payload.url || "/staff" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/staff";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
