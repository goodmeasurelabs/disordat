/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // /vs/<slug>.md is the plain-markdown twin of each verdict page, for
      // agents and LLMs. It must win over the /vs/[slug] page route.
      beforeFiles: [{ source: '/vs/:slug([a-z0-9-]+)\\.md', destination: '/api/md/:slug' }],
    }
  },
};

export default nextConfig;
