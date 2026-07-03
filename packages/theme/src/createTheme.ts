/**
 * createTheme — 自定义主题创建 / 扩展工具
 *
 * 用于创建自定义主题或扩展现有主题。
 * 使用深合并策略，只需传入要覆盖的令牌。
 *
 * @example
 * ```tsx
 * const myTheme = createLightTheme({ color: { primary: '#7c3aed' } });
 * ```
 */

import { lightTheme, darkTheme } from './themes';
import type { ThemeTokens } from './types';

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== undefined &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = { ...(tgtVal as object), ...(srcVal as object) };
    } else if (srcVal !== undefined) {
      result[key] = srcVal;
    }
  }
  return result;
}

/**
 * 基于 light 主题创建自定义主题
 */
export function createLightTheme(overrides: Partial<ThemeTokens>): ThemeTokens {
  return mergeDeep(
    lightTheme as unknown as Record<string, unknown>,
    overrides as unknown as Record<string, unknown>,
  ) as unknown as ThemeTokens;
}

/**
 * 基于 dark 主题创建自定义主题
 */
export function createDarkTheme(overrides: Partial<ThemeTokens>): ThemeTokens {
  return mergeDeep(
    darkTheme as unknown as Record<string, unknown>,
    overrides as unknown as Record<string, unknown>,
  ) as unknown as ThemeTokens;
}
