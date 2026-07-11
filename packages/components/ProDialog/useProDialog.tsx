import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createImperativeInstance } from '@lania-pro-components/shared';
import type {
  ProDialogInstance,
  ProDialogProps,
  UseProDialogOptions,
  UseProDialogReturn,
  OpenDialogParams,
} from './types';
import { instanceRegistry as dialogInstanceRegistry } from './instanceRegistry';
import { ProDialog } from './ProDialog';

export function useProDialog<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: UseProDialogOptions<TValues, T> = {}): UseProDialogReturn<TValues, T> {
  const { name, fullscreen: fullscreenProp, ...dialogProps } = options;

  const dialogRef = useRef<ProDialogInstance<TValues, T> | null>(null);
  const instanceHandleRef = useRef<{ close: () => void } | null>(null);
  const managerRef = useRef<ReturnType<
    typeof createImperativeInstance<{
      options: UseProDialogOptions<TValues, T>;
      dialogProps: ProDialogProps<TValues, T>;
      params?: OpenDialogParams<TValues>;
    }>
  > | null>(null);
  const [visible, setVisible] = useState(false);
  const [fullscreen, setFullscreenState] = useState(fullscreenProp || false);

  const ensureManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createImperativeInstance<{
        options: UseProDialogOptions<TValues, T>;
        dialogProps: ProDialogProps<TValues, T>;
        params?: OpenDialogParams<TValues>;
      }>(({ options: _opts, dialogProps: dp, params }) => (
        <ProDialog
          {...dp}
          defaultVisible={false}
          ref={(instance: ProDialogInstance<TValues, T> | null) => {
            if (instance && !dialogRef.current) {
              dialogRef.current = instance;
              instance.open(params);
              setVisible(true);
              if (name) {
                dialogInstanceRegistry.register(name, instance as ProDialogInstance);
              }
            }
          }}
        />
      ));
    }
    return managerRef.current;
  }, [name]);

  const open = useCallback(
    (params?: OpenDialogParams<TValues>) => {
      const manager = ensureManager();
      instanceHandleRef.current = manager.open({ options, dialogProps, params });
    },
    [dialogProps, options, ensureManager],
  );

  const close = useCallback(() => {
    dialogRef.current?.close();
    instanceHandleRef.current?.close();
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    if (dialogRef.current) {
      dialogRef.current.toggle();
      setVisible((v) => !v);
    } else {
      open();
    }
  }, [open]);

  const destroy = useCallback(() => {
    dialogRef.current?.destroy();
    managerRef.current?.closeAll();
    instanceHandleRef.current = null;
    dialogRef.current = null;
    setVisible(false);
    if (name) {
      dialogInstanceRegistry.unregister(name);
    }
  }, [name]);

  useEffect(
    () => () => {
      destroy();
    },
    [destroy],
  );

  return {
    visible,
    state: {
      visible,
      confirmLoading: false,
      confirmDisabled: false,
      title: dialogProps.title || '',
      fullscreen,
      contentLoading: false,
    },
    open,
    close,
    toggle,
    setTitle: (title) => dialogRef.current?.setTitle(title),
    setConfirmLoading: (loading) => dialogRef.current?.setConfirmLoading(loading),
    setConfirmDisabled: (disabled) => dialogRef.current?.setConfirmDisabled(disabled),
    setFullscreen: (fs) => {
      setFullscreenState(fs);
      dialogRef.current?.update({ fullscreen: fs });
    },
    dialogInstance: dialogRef.current ?? ({} as ProDialogInstance<TValues, T>),
    dialogProps: {
      ...dialogProps,
      fullscreen,
      visible: false,
      onVisibleChange: () => {},
    },
    dialog: dialogRef.current ?? ({} as ProDialogInstance<TValues, T>),
    form: dialogRef.current?.getFormInstance(),
    table: dialogRef.current?.getTableAction(),
  };
}
