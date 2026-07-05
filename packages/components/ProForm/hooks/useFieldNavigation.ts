/**
 * @deprecated 请从 @lania-pro-components/shared 导入 useFieldNavigation
 * 此文件为向后兼容保留的适配器壳
 */
import type { KeyboardNavigationConfig } from '../types';
import { useFieldNavigation as useFieldNavigationShared, type UseFieldNavigationReturn } from '@lania-pro-components/shared';

interface FieldNavigationOptions {
  schemas: Array<{ name: string | string[] }>;
  getRef: (name: string) => unknown;
  keyboardNavigation?: KeyboardNavigationConfig;
  onFocusField?: (name: string) => void;
  onBlurField?: (name: string) => void;
}

export const useFieldNavigation = ({
  schemas,
  getRef,
  keyboardNavigation,
  onFocusField,
  onBlurField,
}: FieldNavigationOptions): UseFieldNavigationReturn => {
  const getElement = (name: string): HTMLElement | null => {
    const ref = getRef(name);
    if (!ref) {
      return null;
    }

    if (typeof ref === 'object' && ref !== null) {
      interface Focusable {
        focus: () => void;
      }
      if ('focus' in ref && typeof (ref as Focusable).focus === 'function') {
        return ref as HTMLElement;
      }

      if ('current' in ref && (ref as React.RefObject<HTMLElement>).current) {
        return (ref as React.RefObject<HTMLElement>).current;
      }
    }

    const element = document.querySelector(`[data-field-name="${name}"]`) as HTMLElement;
    if (element) {
      const input = element.querySelector('input, textarea, select, [tabindex]') as HTMLElement;
      return input || element;
    }

    return null;
  };

  return useFieldNavigationShared({
    items: schemas.map((schema) => ({ id: schema.name })),
    getElement,
    config: keyboardNavigation,
    onFocus: onFocusField,
    onBlur: onBlurField,
  });
};

export type { UseFieldNavigationReturn } from '@lania-pro-components/shared';