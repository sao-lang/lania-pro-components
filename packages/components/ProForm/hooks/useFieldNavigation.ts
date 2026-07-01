/* eslint-disable max-lines-per-function */
import React, { useRef, useCallback, useEffect } from 'react';
import type { KeyboardNavigationConfig } from '../types';

interface FieldNavigationOptions {
  schemas: Array<{ name: string | string[] }>;
  getRef: (name: string) => unknown;
  keyboardNavigation?: KeyboardNavigationConfig;
  onFocusField?: (name: string) => void;
  onBlurField?: (name: string) => void;
}

export interface UseFieldNavigationReturn {
  focusedField: string | undefined;
  focusField: (name: string) => void;
  focusNextField: (currentName?: string) => void;
  focusPrevField: (currentName?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  registerFieldFocus: (name: string) => () => void;
  registerFieldBlur: (name: string) => () => void;
}

export const useFieldNavigation = ({
  schemas,
  getRef,
  keyboardNavigation,
  onFocusField,
  onBlurField,
}: FieldNavigationOptions): UseFieldNavigationReturn => {
  const focusedFieldRef = useRef<string | undefined>(undefined);
  const config = keyboardNavigation || {};
  const { enabled = true, autoFocusFirstField = true, tabBehavior = 'default', arrowKeyNavigation = true } = config;

  const getVisibleFieldNames = useCallback(
    (): string[] =>
      schemas
        .map((schema) => (Array.isArray(schema.name) ? schema.name[0] : schema.name))
        .filter((name): name is string => !!name),
    [schemas],
  );

  const getFieldElement = useCallback(
    (name: string): HTMLElement | null => {
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
    },
    [getRef],
  );

  const focusField = useCallback(
    (name: string) => {
      const element = getFieldElement(name);
      if (element) {
        element.focus();
        focusedFieldRef.current = name;
      }
    },
    [getFieldElement],
  );

  const focusNextField = useCallback(
    (currentName?: string) => {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length === 0) {
        return;
      }

      const current = currentName || focusedFieldRef.current;
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
    (currentName?: string) => {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length === 0) {
        return;
      }

      const current = currentName || focusedFieldRef.current;
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
    (name: string) => {
      focusedFieldRef.current = name;
      onFocusField?.(name);
      return () => {
        if (focusedFieldRef.current === name) {
          focusedFieldRef.current = undefined;
        }
      };
    },
    [onFocusField],
  );

  const registerFieldBlur = useCallback(
    (name: string) => {
      onBlurField?.(name);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    },
    [onBlurField],
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
