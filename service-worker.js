// سرویس‌ورکر اپ دفترچه اقساط
// وظایف: کش کردن فایل‌های اصلی برای کارکرد آفلاین + دریافت و نمایش Push Notification

const CACHE_NAME = "installment-pwa-v4";
const CORE_ASSETS = [
  "/",
  "/style.css",
  "/jalaali.js",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/watermark-nelin.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// فقط درخواست‌های GET همین دامنه رو کش می‌کنیم؛ هر چیز دیگه (ازجمله تماس‌های
// Cross-Origin با Cloudflare Worker) مستقیم از شبکه می‌ره
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// دریافت Push از سرور
self.addEventListener("push", (event) => {
  let data = { title: "یادآوری قسط", body: "یه قسط نزدیکه سررسیدشه." };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    /* payload متنی ساده بود، از پیش‌فرض استفاده می‌شه */
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    dir: "rtl",
    lang: "fa",
    data: { installmentId: data.installmentId || null },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// کلیک روی نوتیفیکیشن -> باز کردن (یا فوکوس) اپ
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
