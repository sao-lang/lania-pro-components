/* eslint-disable prettier/prettier */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest 配置
 * 覆盖 @lania-pro-components/components 的单元测试
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 测试直接跑 utils 源码，无需先 build
      '@lania-pro-components/utils': path.resolve(__dirname, 'packages/utils/src/index.ts'),
      '@lania-pro-components/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'test/**/*.{test,spec}.{ts,tsx}',
      'packages/components/test/**/*.{test,spec}.{ts,tsx}',
      'packages/components/*/test/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules', '**/dist/**', 'docs', '.vitepress'],
    css: {
      // Arco Design 会引入大量 CSS，测试时不需要真实样式
      modules: { classNameStrategy: 'non-scoped' },
    },
    // 提升 snapshot / dom 输出可读性
    // window.matchMedia 等在 jsdom 中缺失，由 setup 文件补齐
  },
});
