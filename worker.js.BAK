addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  let path = url.pathname;

  // Default to index.html
  if (path === '/') path = '/index.html';

  try {
    // Fetch the file from the dist folder
    const response = await fetch(new URL(`./dist${path}`, import.meta.url));
    if (!response.ok) throw new Error('Not found');
    return response;
  } catch (e) {
    return new Response('404 Not Found', { status: 404 });
  }
}
