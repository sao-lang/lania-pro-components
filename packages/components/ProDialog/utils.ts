/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { DialogSize, FooterPosition } from './types';

export const getSizeWidth = (size: DialogSize): number | string => {
  switch (size) {
    case 'small':
      return 400;
    case 'medium':
      return 600;
    case 'large':
      return 800;
    case 'xlarge':
      return 1000;
    case 'fullscreen':
      return '100%';
    default:
      return 600;
  }
};

export const getFooterJustify = (position: FooterPosition): string => {
  switch (position) {
    case 'left':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'right':
      return 'flex-end';
    default:
      return 'flex-end';
  }
};

export function deepMerge<T, U>(target: T, source: U): T & U {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  Object.keys((source as Record<string, unknown>) || {}).forEach((key) => {
    const sv = (source as Record<string, unknown>)[key];
    const tv = (target as Record<string, unknown>)[key];
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv)) {
      result[key] = deepMerge(
        tv !== null && typeof tv === 'object' ? (tv as Record<string, unknown>) : {},
        sv as Record<string, unknown>,
      );
    } else {
      result[key] = sv;
    }
  });
  return result as T & U;
}
