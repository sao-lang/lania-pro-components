import { deepMerge } from './utils';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal } from '@arco-design/web-react';
import type { ConfirmProps } from '@arco-design/web-react/es/Modal/confirm';
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

  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  const close = () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (autoClose) {
      close();
    }
  };

  const modalConfig = {
    title,
    content: (
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
          {icon || getDefaultIcon()}
        </div>
        <div style={{ lineHeight: 1.5, display: 'flex', alignItems: 'center' }}>{content}</div>
      </div>
    ),
    okText,
    cancelText,
    onOk: handleConfirm as (e?: MouseEvent) => void | Promise<void>,
    onCancel: close,
  } as const;

  interface ModalResult {
    update: (config: unknown) => void;
    close: () => void;
  }

  let modalResult: ModalResult;

  switch (type) {
    case 'info':
      modalResult = Modal.info({ ...modalConfig, ...restConfig } as ConfirmProps) as ModalResult;
      break;
    case 'success':
      modalResult = Modal.success({ ...modalConfig, ...restConfig } as ConfirmProps) as ModalResult;
      break;
    case 'warning':
      modalResult = Modal.warning({ ...modalConfig, ...restConfig } as ConfirmProps) as ModalResult;
      break;
    case 'error':
      modalResult = Modal.error({ ...modalConfig, ...restConfig } as ConfirmProps) as ModalResult;
      break;
    default:
      modalResult = Modal.confirm({ ...modalConfig, ...restConfig } as ConfirmProps) as ModalResult;
  }

  return {
    update: (newConfig: Partial<OpenDialogConfig>) => {
      const merged = deepMerge(
        { ...modalConfig, ...restConfig } as Record<string, unknown>,
        newConfig as Record<string, unknown>,
      );
      const confirmNewConfig = newConfig as Partial<ConfirmDialogConfig>;
      modalResult.update({
        ...merged,
        content:
          confirmNewConfig.content !== undefined || confirmNewConfig.icon !== undefined ? (
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
                {confirmNewConfig.icon ||
                  ((merged as Record<string, unknown>).icon as React.ReactNode) ||
                  getDefaultIcon()}
              </div>
              <div
                style={{
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {confirmNewConfig.content !== undefined ? confirmNewConfig.content : modalConfig.content}
              </div>
            </div>
          ) : (
            modalConfig.content
          ),
      } as ConfirmProps);
    },
    close: () => {
      modalResult.close();
      close();
    },
    destroy: () => {
      modalResult.close();
      close();
    },
  };
}
