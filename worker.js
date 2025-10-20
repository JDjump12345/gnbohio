import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    // Serve the requested file or default to index.html
    return await getAssetFromKV(event, {
      mapRequestToAsset: req => {
        const url = new URL(req.url);
        // if root, serve index.html
        if (url.pathname === '/') {
          url.pathname = '/index.html';
        }
        return new Request(url.toString(), req);
      }
    });
  } catch (e) {
    return new Response('Not found', { status: 404 });
  }
}
