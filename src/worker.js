// Simple static asset server for Cloudflare Workers
export default {
  async fetch(request, env, _ctx) {
    // Serve static assets from the dist directory
    return env.ASSETS.fetch(request);
  },
};