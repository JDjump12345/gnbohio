addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => new Response("File not found", { status: 404 }))
  );
});
