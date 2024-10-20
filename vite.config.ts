server: {
  host: true, // 外部ネットワークでのアクセスを許可
  port: process.env.PORT || 5173, // 環境変数PORTまたはデフォルトでポート5173を使用
  proxy: {
    '/api': {
      target: 'https://newsapi.org/v2',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      configure: (proxy, _options) => {
        proxy.on('proxyReq', (proxyReq, req, _res) => {
          proxyReq.setHeader('Authorization', `Bearer ${env.VITE_NEWS_API_KEY}`);
        });
      },
    },
  },
}
