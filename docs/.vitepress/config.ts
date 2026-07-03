import { defineConfig } from 'vitepress';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolveIcons } from './plugins/resolveIcons';

export default defineConfig({
  title: 'Lania Pro Components',
  description: '基于 Arco Design 的 Schema 驱动企业级组件库',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '组件', link: '/components/pro-form' },
    ],
    sidebar: {
      '/components/': [
        {
          text: '组件',
          items: [
            { text: 'ProForm', link: '/components/pro-form' },
            { text: 'ProTable', link: '/components/pro-table' },
            { text: 'ProDialog', link: '/components/pro-dialog' },
            { text: 'ProSelect', link: '/components/pro-select' },
            { text: 'ProUpload', link: '/components/pro-upload' },
            { text: 'ActionButton', link: '/components/action-button' },
            { text: 'ProLayout', link: '/components/pro-layout' },
            { text: 'ProQueryForm', link: '/components/pro-query-form' },
            { text: 'ProDescriptions', link: '/components/pro-descriptions' },
            { text: 'ProChart', link: '/components/pro-chart' },
            { text: 'Theme', link: '/components/theme' },
          ],
        },
      ],
    },
  },
  build: {
    ssr: false,
  },
  vite: {
    plugins: [react()],
    resolve: {
      alias: {
        '@lania-pro-components/components': path.resolve(__dirname, '../../packages/components/index.ts'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    ssr: {
      noExternal: ['@arco-design/web-react', '@arco-design/web-react/icon'],
    },
    optimizeDeps: {
      include: ['@arco-design/web-react', '@arco-design/web-react/icon'],
    },
  },
});
