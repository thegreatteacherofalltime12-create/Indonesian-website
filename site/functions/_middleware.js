// Redirect www to the apex domain so the site has one canonical address.
// A _redirects file cannot do this: Pages matches those on path only, not on host.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
