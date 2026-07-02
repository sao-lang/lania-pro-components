import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const components = [
  { name: 'ActionButton', ext: 'tsx' },
  { name: 'ProDialog', ext: 'tsx' },
  { name: 'ProForm', ext: 'ts' },
  { name: 'ProTable', ext: 'tsx' },
  { name: 'ProSelect', ext: 'tsx' },
  { name: 'ProUpload', ext: 'tsx' },
];

const baseConfig = {
  external: ['react', 'react-dom', '@arco-design/web-react', '@arco-design/web-react/icon'],
  plugins: [
    nodeResolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      declaration: true,
      declarationMap: true,
    }),
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      presets: ['@babel/preset-react', '@babel/preset-typescript'],
      babelHelpers: 'bundled',
    }),
  ],
};

const componentConfigs = components.flatMap(component => [
  {
    ...baseConfig,
    input: path.resolve(__dirname, `packages/components/${component.name}/index.${component.ext}`),
    output: [
      {
        file: path.resolve(__dirname, `packages/components/dist/${component.name}/index.cjs`),
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: path.resolve(__dirname, `packages/components/dist/${component.name}/index.mjs`),
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
  {
    input: path.resolve(__dirname, `packages/components/${component.name}/index.${component.ext}`),
    output: {
      file: path.resolve(__dirname, `packages/components/dist/${component.name}/index.d.ts`),
      format: 'esm',
    },
    plugins: [dts()],
  },
]);

const themeConfig = [
  {
    ...baseConfig,
    input: path.resolve(__dirname, 'packages/theme/src/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'packages/theme/dist/index.cjs'),
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: path.resolve(__dirname, 'packages/theme/dist/index.mjs'),
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      ...baseConfig.plugins,
      copy({
        targets: [
          { src: [path.resolve(__dirname, 'packages/theme/src/light.css')], dest: path.resolve(__dirname, 'packages/theme/dist') },
          { src: [path.resolve(__dirname, 'packages/theme/src/dark.css')], dest: path.resolve(__dirname, 'packages/theme/dist') },
        ],
        flatten: true,
        verbose: true,
      }),
    ],
  },
  {
    input: path.resolve(__dirname, 'packages/theme/src/index.ts'),
    output: {
      file: path.resolve(__dirname, 'packages/theme/dist/index.d.ts'),
      format: 'esm',
    },
    plugins: [dts()],
  },
];

export default defineConfig([
  {
    ...baseConfig,
    input: path.resolve(__dirname, 'packages/components/index.ts'),
    output: [
      {
        file: path.resolve(__dirname, 'packages/components/dist/index.cjs'),
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: path.resolve(__dirname, 'packages/components/dist/index.mjs'),
        format: 'esm',
        sourcemap: true,
      },
      {
        file: path.resolve(__dirname, 'packages/components/dist/index.min.mjs'),
        format: 'esm',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
  },
  {
    input: path.resolve(__dirname, 'packages/components/index.ts'),
    output: {
      file: path.resolve(__dirname, 'packages/components/dist/index.d.ts'),
      format: 'esm',
    },
    plugins: [dts()],
  },
  ...componentConfigs,
  ...themeConfig,
]);