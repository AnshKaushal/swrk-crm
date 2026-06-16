self.addEventListener("push", function (event) {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: "/logo-square-light.png",
      badge: "/logo-square-light.png",
      data: {
        url: data.url || "/pipeline",
      },
    }

    event.waitUntil(
      self.registration.showNotification(data.title || "SWRK CRM", options),
    )
  } catch {
    // invalid payload
  }
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()

  const url = event.notification.data?.url || "/pipeline"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})
