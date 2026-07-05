import React, { useRef, useCallback, useEffect } from 'react';

export interface KeyboardNavigationConfig {
  enabled?: boolean;
  autoFocusFirstField?: boolean;
  tabBehavior?: 'next' | 'default';
  arrowKeyNavigation?: boolean;
}

export interface FocusableItem {
  id: string | string[];
}

export interface FieldNavigationOptions {
  items: Array<FocusableItem> | string[];
  getElement: (id: string) => HTMLElement | null;
  config?: KeyboardNavigationConfig;
  onFocus?: (id: string) => void;
  onBlur?: (id: string) => void;
}

export interface UseFieldNavigationReturn {
  focusedField: string | undefined;
  focusField: (id: string) => void;
  focusNextField: (currentId?: string) => void;
  focusPrevField: (currentId?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  registerFieldFocus: (id: string) => () => void;
  registerFieldBlur: (id: string) => () => void;
}

export const useFieldNavigation = ({
  items,
  getElement,
  config,
  onFocus,
  onBlur,
}: FieldNavigationOptions): UseFieldNavigationReturn => {
  const focusedFieldRef = useRef<string | undefined>(undefined);
  const navigationConfig = config || {};
  const {
    enabled = true,
    autoFocusFirstField = true,
    tabBehavior = 'default',
    arrowKeyNavigation = true,
  } = navigationConfig;

  const getVisibleFieldNames = useCallback((): string[] => {
    if (Array.isArray(items)) {
      if (items.length === 0) {
        return [];
      }
      if (typeof items[0] === 'string') {
        return items as string[];
      }
      return (items as FocusableItem[])
        .map((item) => (Array.isArray(item.id) ? item.id[0] : item.id))
        .filter((id): id is string => !!id);
    }
    return [];
  }, [items]);

  const focusField = useCallback(
    (id: string) => {
      const element = getElement(id);
      if (element) {
        element.focus();
        focusedFieldRef.current = id;
      }
    },
    [getElement],
  );

  const focusNextField = useCallback(
    (currentId?: string) => {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length === 0) {
        return;
      }

      const current = currentId || focusedFieldRef.current;
      let nextIndex = 0;

      if (current) {
        const currentIndex = fieldNames.indexOf(current);
        nextIndex = currentIndex + 1;
        if (nextIndex >= fieldNames.length) {
          nextIndex = 0;
        }
      }

      focusField(fieldNames[nextIndex]);
    },
    [getVisibleFieldNames, focusField],
  );

  const focusPrevField = useCallback(
    (currentId?: string) => {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length === 0) {
        return;
      }

      const current = currentId || focusedFieldRef.current;
      let prevIndex = fieldNames.length - 1;

      if (current) {
        const currentIndex = fieldNames.indexOf(current);
        prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = fieldNames.length - 1;
        }
      }

      focusField(fieldNames[prevIndex]);
    },
    [getVisibleFieldNames, focusField],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const { key, shiftKey } = e;

      if (tabBehavior === 'next' && key === 'Tab') {
        e.preventDefault();
        if (shiftKey) {
          focusPrevField();
        } else {
          focusNextField();
        }
        return;
      }

      if (arrowKeyNavigation) {
        if (key === 'ArrowDown') {
          e.preventDefault();
          focusNextField();
        } else if (key === 'ArrowUp') {
          e.preventDefault();
          focusPrevField();
        }
      }
    },
    [enabled, tabBehavior, arrowKeyNavigation, focusNextField, focusPrevField],
  );

  const registerFieldFocus = useCallback(
    (id: string) => {
      focusedFieldRef.current = id;
      onFocus?.(id);
      return () => {
        if (focusedFieldRef.current === id) {
          focusedFieldRef.current = undefined;
        }
      };
    },
    [onFocus],
  );

  const registerFieldBlur = useCallback(
    (id: string) => {
      onBlur?.(id);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    },
    [onBlur],
  );

  useEffect(() => {
    if (enabled && autoFocusFirstField) {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length > 0) {
        const timer = setTimeout(() => {
          focusField(fieldNames[0]);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [enabled, autoFocusFirstField, getVisibleFieldNames, focusField]);

  return {
    focusedField: focusedFieldRef.current,
    focusField,
    focusNextField,
    focusPrevField,
    handleKeyDown,
    registerFieldFocus,
    registerFieldBlur,
  };
};
