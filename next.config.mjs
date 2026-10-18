/** O runtime 3D permanece isolado: nenhum reset CSS de React altera o original. */
const pages = process.env.GITHUB_PAGES === 'true';
export default {
  poweredByHeader: false,
  ...(pages ? {
    output: 'export',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/meu-site-3d',
    trailingSlash: true,
  } : {
    async headers() {
      return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] }];
    },
  }),
};
