addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Serve JSON files from rss folder
  if (url.pathname.startsWith("/rss/")) {
    return fetch(new URL(`dist${url.pathname}`, import.meta.url));
  }

  // Serve everything else from dist
  return fetch(new URL(`dist${url.pathname}`, import.meta.url));
}
