/**
 * @deprecated 请从 @lania-pro-components/shared 导入 useFieldNavigation
 * 此文件为向后兼容保留的适配器壳
 */
import type { KeyboardNavigationConfig, FormStoreAPI } from '../types';
import {
  useFieldNavigation as useFieldNavigationShared,
  type UseFieldNavigationReturn,
} from '@lania-pro-components/shared';

interface FieldNavigationOptions {
  schemas: Array<{
    name: string | string[];
    keyboardNavigation?:
      | {
          onFocus?: (name: string) => void;
          onBlur?: (name: string) => void;
        }
      | ((values: Record<string, unknown>) => {
          onFocus?: (name: string) => void;
          onBlur?: (name: string) => void;
        });
  }>;
  getRef: (name: string) => unknown;
  keyboardNavigation?: KeyboardNavigationConfig;
  /** 表单 store（用于内部始终执行 field.setFocus/removeFocus） */
  formStore: FormStoreAPI;
  /** 用户自定义焦点回调（schema 未定义 keyboardNavigation.onFocus 时使用） */
  onFocus?: (name: string) => void;
  /** 用户自定义失焦回调（schema 未定义 keyboardNavigation.onBlur 时使用） */
  onBlur?: (name: string) => void;
}
interface Focusable {
  focus: () => void;
}
export const useFieldNavigation = ({
  schemas,
  getRef,
  keyboardNavigation,
  formStore,
  onFocus,
  onBlur,
}: FieldNavigationOptions): UseFieldNavigationReturn => {
  const getElement = (name: string): HTMLElement | null => {
    const ref = getRef(name);
    if (!ref) {
      return null;
    }

    if (typeof ref === 'object' && ref !== null) {
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
    // field.setFocus/removeFocus 始终执行（默认行为），
    // schema.keyboardNavigation.onFocus ?? props.onFocus 择一执行（自定义行为）
    items: schemas.map((schema) => {
      const values = formStore.getValues();
      const resolvedKbNav =
        typeof schema.keyboardNavigation === 'function' ? schema.keyboardNavigation(values) : schema.keyboardNavigation;
      return {
        id: schema.name,
        onFocus: (name: string) => {
          formStore.getField(name)?.setFocus();
          (resolvedKbNav?.onFocus ?? onFocus)?.(name);
        },
        onBlur: (name: string) => {
          formStore.getField(name)?.removeFocus();
          (resolvedKbNav?.onBlur ?? onBlur)?.(name);
        },
      };
    }),
    getElement,
    config: keyboardNavigation,
  });
};

export type { UseFieldNavigationReturn } from '@lania-pro-components/shared';
