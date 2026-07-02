import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const components = [
  'ActionButton',
  'ProDialog',
  'ProForm',
  'ProTable',
  'ProSelect',
  'ProUpload',
];

const baseConfig = {
  external: ['react', 'react-dom', '@arco-design/web-react', '@arco-design/web-react/icon'],
  plugins: [
    nodeResolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs(),
    babel({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      presets: ['@babel/preset-react'],
      babelHelpers: 'bundled',
    }),
    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      declaration: true,
      declarationMap: true,
    }),
  ],
};

const componentConfigs = components.flatMap(component => [
  {
    ...baseConfig,
    input: `packages/components/${component}/index.ts${component === 'ActionButton' ? 'x' : ''}`,
    output: [
      {
        file: `packages/components/dist/${component}/index.cjs`,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: `packages/components/dist/${component}/index.mjs`,
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
  {
    input: `packages/components/${component}/index.ts${component === 'ActionButton' ? 'x' : ''}`,
    output: {
      file: `packages/components/dist/${component}/index.d.ts`,
      format: 'esm',
    },
    plugins: [dts()],
  },
]);

export default defineConfig([
  {
    ...baseConfig,
    input: 'packages/components/index.ts',
    output: [
      {
        file: 'packages/components/dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'packages/components/dist/index.mjs',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'packages/components/dist/index.min.mjs',
        format: 'esm',
        sourcemap: true,
        plugins: [terser()],
      },
    ],
  },
  {
    input: 'packages/components/index.ts',
    output: {
      file: 'packages/components/dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
  ...componentConfigs,
]);