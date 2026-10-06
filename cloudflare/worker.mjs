import next from '../.open-next/worker.js';
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from '../.open-next/worker.js';
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'www.disordat.org') {
      url.hostname = 'disordat.org';
      return Response.redirect(url, 308);
    }
    const preview = url.hostname !== 'disordat.org';
    if (preview && url.pathname === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
    const response = await next.fetch(request, env, ctx);
    if (!preview) return response;
    const result = new Response(response.body, response);
    result.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return result;
  }
};
