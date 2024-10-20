import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: true,  // 外部からアクセス可能に設定
      port: Number(process.env.PORT) || 5173,  // 環境変数PORTを使うか、デフォルト5173ポートを使用
      proxy: {
        '/api': {
          target: 'https://newsapi.org/v2',  // NewsAPIのエンドポイント
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),  // `/api` を削除
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // AuthorizationヘッダーにAPIキーを追加
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_NEWS_API_KEY}`);
            });
          },
        },
      },
    },
  };
});
