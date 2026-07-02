import { deepMerge } from './utils';
import React, { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { IconInfoCircle, IconCheckCircle, IconExclamationCircle, IconCloseCircle } from '@arco-design/web-react/icon';
import type {
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  ProDialogInstance,
  ProDialogProps,
} from './types';
import { ProDialog } from './index';

interface DialogHolderProps<TValues, T> {
  config: OpenDialogConfig<TValues, T>;
  onClose: () => void;
}

function DialogHolder<TValues, T>({ config, onClose }: DialogHolderProps<TValues, T>) {
  const [visible, setVisible] = useState(true);
  const [currentConfig, setCurrentConfig] = useState<OpenDialogConfig<TValues, T>>(config);
  const dialogRef = useRef<ProDialogInstance<TValues, T> | null>(null);

  const handleClose = useCallback(() => {
    setVisible(false);
    currentConfig.onCancel?.();
    onClose();
  }, [currentConfig, onClose]);

  const handleOk = useCallback(() => {
    const instance = dialogRef.current;
    if (instance) {
      instance.submitForm?.();
    }
  }, [currentConfig]);

  const handleUpdate = useCallback((newConfig: Partial<ProDialogProps<TValues, T>>) => {
    setCurrentConfig(
      (prev) =>
        deepMerge(prev as Record<string, unknown>, newConfig as Record<string, unknown>) as OpenDialogConfig<
          TValues,
          T
        >,
    );
  }, []);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.update = handleUpdate;
    }
  }, [handleUpdate]);

  const { content, ...restConfig } = currentConfig;

  return (
    <ProDialog
      {...restConfig}
      ref={dialogRef}
      visible={visible}
      onVisibleChange={(v) => {
        setVisible(v);
        if (!v) {
          onClose();
        }
      }}
      onOk={handleOk}
      onCancel={handleClose}
    >
      {typeof content === 'function' ? content(dialogRef.current!) : content}
    </ProDialog>
  );
}

export function createDialogHolder<TValues, T>(config: OpenDialogConfig<TValues, T>): DialogReturnProps {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  const close = () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const update: DialogReturnProps['update'] = (newConfig) => {
    root.render(
      <DialogHolder<TValues, T> config={{ ...config, ...newConfig } as OpenDialogConfig<TValues, T>} onClose={close} />,
    );
  };

  const destroy = () => {
    close();
  };

  root.render(<DialogHolder<TValues, T> config={config} onClose={close} />);

  return {
    update,
    close,
    destroy,
  };
}

export function renderConfirmDialog(config: ConfirmDialogConfig): DialogReturnProps {
  const {
    type = 'confirm',
    title,
    content,
    icon,
    okText = '确认',
    cancelText = '取消',
    onConfirm,
    autoClose = true,
    ...restConfig
  } = config;

  const getDefaultIcon = () => {
    switch (type) {
      case 'info':
        return <IconInfoCircle style={{ color: 'var(--color-primary)' }} />;
      case 'success':
        return <IconCheckCircle style={{ color: 'var(--color-success)' }} />;
      case 'warning':
        return <IconExclamationCircle style={{ color: 'var(--color-warning)' }} />;
      case 'error':
        return <IconCloseCircle style={{ color: 'var(--color-danger)' }} />;
      default:
        return <IconExclamationCircle style={{ color: 'var(--color-primary)' }} />;
    }
  };

  const renderContent = (iconNode: React.ReactNode, contentNode: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 24,
      }}
    >
      <div
        style={{
          fontSize: 20,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {iconNode}
      </div>
      <div style={{ lineHeight: 1.5, display: 'flex', alignItems: 'center' }}>{contentNode}</div>
    </div>
  );

  const isSimple = type !== 'confirm';
  const hideCancel = type !== 'confirm';

  let currentIcon: ReactNode = icon || getDefaultIcon();
  let currentContent: ReactNode = content;
  let currentOkText = okText;
  let currentCancelText = cancelText;

  const { update: holderUpdate, close: holderClose } = createDialogHolder({
    title,
    content: () => renderContent(currentIcon, currentContent),
    okText,
    cancelText,
    hideCancel,
    simple: isSimple,
    onOk: async () => {
      if (onConfirm) {
        await onConfirm();
      }
      if (autoClose) {
        holderClose();
      }
    },
    onCancel: () => holderClose(),
    ...restConfig,
  });

  return {
    update: (newConfig: Partial<OpenDialogConfig>) => {
      const newConfirmConfig = newConfig as Partial<ConfirmDialogConfig>;
      if (newConfirmConfig.icon !== undefined) {
        currentIcon = newConfirmConfig.icon;
      }
      if (newConfirmConfig.content !== undefined) {
        currentContent = newConfirmConfig.content as React.ReactNode;
      }
      if (newConfirmConfig.okText !== undefined) {
        currentOkText = newConfirmConfig.okText;
      }
      if (newConfirmConfig.cancelText !== undefined) {
        currentCancelText = newConfirmConfig.cancelText;
      }
      holderUpdate({
        ...newConfig,
        content: () => renderContent(currentIcon, currentContent),
        okText: currentOkText,
        cancelText: currentCancelText,
      });
    },
    close: () => {
      holderClose();
    },
    destroy: () => {
      holderClose();
    },
  };
}
