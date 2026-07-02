import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal, Button } from '@arco-design/web-react';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import type { OpenDialogConfig, ConfirmDialogConfig, DialogReturnProps, ProTableActionType } from '../types';
import { ProTable } from '../index';

/**
 * 弹窗容器引用
 */
const dialogContainers: Map<string, HTMLDivElement> = new Map();

/**
 * 创建弹窗容器
 */
const createDialogContainer = (id: string): HTMLDivElement => {
  let container = dialogContainers.get(id);
  if (!container) {
    container = document.createElement('div');
    container.id = `pro-table-n-dialog-${id}`;
    document.body.appendChild(container);
    dialogContainers.set(id, container);
  }
  return container;
};

/**
 * 销毁弹窗容器
 */
const destroyDialogContainer = (id: string) => {
  const container = dialogContainers.get(id);
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
    dialogContainers.delete(id);
  }
};

/**
 * 打开表格选择弹窗
 * @param config 弹窗配置
 * @returns 弹窗控制对象
 */
export const openDialog = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TRow extends Record<string, unknown> = Record<string, unknown>,
>(
  config: OpenDialogConfig<TValues, TRow>,
): DialogReturnProps => {
  const {
    title,
    content,
    width = 800,
    onOk,
    onCancel,
    columns,
    request,
    dataSource,
    // Modal 配置
    mask = true,
    maskClosable = true,
    closable = true,
    alignCenter = false,
    fullscreen: initialFullscreen = false,
    modalStyle,
    modalClassName,
    maskStyle,
    footer: footerConfig,
    okText = '确认',
    cancelText = '取消',
    okButtonProps,
    cancelButtonProps,
    hideOkButton = false,
    hideCancelButton = false,
    hideFullscreenButton = false,
    afterOpen,
    afterClose,
    getPopupContainer: customGetPopupContainer,
    mountOnEnter = true,
    unmountOnExit = true,
    escToExit = true,
    autoFocus = true,
    focusLock = true,
    simple = false,
    closeIcon,
    modalRender,
    ...restConfig
  } = config;

  const containerId = `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const container = createDialogContainer(containerId);

  const [visible, setVisible] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(initialFullscreen);
  const tableActionRef = useRef<ProTableActionType>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [selectedRows, setSelectedRows] = useState<TRow[]>([]);

  // 关闭弹窗
  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      afterClose?.();
      destroyDialogContainer(containerId);
    }, 300);
  }, [containerId, afterClose]);

  // 销毁弹窗
  const destroy = useCallback(() => {
    setVisible(false);
    destroyDialogContainer(containerId);
  }, [containerId]);

  // 弹窗打开后的回调
  useEffect(() => {
    if (visible) {
      afterOpen?.();
    }
  }, [visible, afterOpen]);

  // 更新弹窗配置
  const update = useCallback((newConfig: Partial<OpenDialogConfig<TValues, TRow>>) => {
    // 通过重新渲染实现更新
    // 这里简化处理，实际可以通过状态管理实现
    if (newConfig.title !== undefined) {
      // 更新标题
    }
  }, []);

  // 确认处理
  const handleOk = useCallback(async () => {
    if (onOk) {
      setConfirmLoading(true);
      try {
        const result = await onOk(selectedRows as unknown as TValues, selectedRows[0]);
        if (result !== false) {
          close();
        }
      } finally {
        setConfirmLoading(false);
      }
    } else {
      close();
    }
  }, [onOk, selectedRows, close]);

  // 取消处理
  const handleCancel = useCallback(() => {
    onCancel?.();
    close();
  }, [onCancel, close]);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
  }, []);

  // 渲染弹窗内容
  const renderContent = () => {
    if (content) {
      if (typeof content === 'function') {
        return (content as Function)({
          close,
          update,
          destroy,
        });
      }
      return content;
    }

    // 表格选择模式
    if (columns) {
      return (
        <ProTable<TRow>
          actionRef={tableActionRef}
          columns={columns}
          request={request}
          dataSource={dataSource}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            selectedRows,
            onChange: (keys: (string | number)[], rows: TRow[]) => {
              setSelectedRowKeys(keys);
              setSelectedRows(rows);
            },
          }}
          pagination={{ pageSize: 10 }}
          search={false}
          toolbar={{
            title,
            showRefresh: true,
          }}
          {...(restConfig as Record<string, unknown>)}
        />
      );
    }

    return null;
  };

  // 渲染底部按钮
  const renderFooter = () => {
    // 如果 footerConfig 是 ReactNode，直接返回
    if (footerConfig !== undefined && typeof footerConfig !== 'boolean') {
      return footerConfig;
    }

    // 如果 footerConfig 是 false，不显示底部
    if (footerConfig === false) {
      return null;
    }

    // 默认底部按钮
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {!hideFullscreenButton && (
          <Button
            type='text'
            icon={fullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
            onClick={toggleFullscreen}
          />
        )}
        {!hideCancelButton && (
          <Button onClick={handleCancel} {...cancelButtonProps}>
            {cancelText}
          </Button>
        )}
        {!hideOkButton && (
          <Button type='primary' loading={confirmLoading} onClick={handleOk} {...okButtonProps}>
            {okText}
          </Button>
        )}
      </div>
    );
  };

  // 渲染弹窗
  const DialogComponent = () => (
    <Modal
      title={title}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
      mask={mask}
      maskClosable={maskClosable}
      closable={closable}
      alignCenter={alignCenter}
      style={{
        width: fullscreen ? '100%' : width,
        maxWidth: '100vw',
        maxHeight: '100vh',
        top: fullscreen ? 0 : undefined,
        ...modalStyle,
      }}
      className={modalClassName}
      maskStyle={maskStyle}
      footer={renderFooter()}
      getPopupContainer={customGetPopupContainer || (() => container)}
      mountOnEnter={mountOnEnter}
      unmountOnExit={unmountOnExit}
      escToExit={escToExit}
      autoFocus={autoFocus}
      focusLock={focusLock}
      simple={simple}
      closeIcon={closeIcon}
      modalRender={modalRender}
    >
      {renderContent()}
    </Modal>
  );

  // 渲染到容器
  const root = document.createElement('div');
  container.appendChild(root);

  // 使用 React 渲染
  const ReactDOM = require('react-dom');
  ReactDOM.render(<DialogComponent />, root);

  return {
    update,
    close,
    destroy,
  };
};

/**
 * 打开确认对话框
 * @param config 确认对话框配置
 * @returns 弹窗控制对象
 */
export const confirm = (config: ConfirmDialogConfig): DialogReturnProps => {
  const {
    title = '确认',
    content,
    onConfirm,
    onCancel,
    // Modal 配置
    width = 400,
    mask = true,
    maskClosable = false,
    closable = true,
    alignCenter = true,
    modalStyle,
    modalClassName,
    maskStyle,
    confirmText = '确认',
    cancelText = '取消',
    confirmButtonType = 'primary',
    confirmButtonStatus,
    confirmButtonProps,
    cancelButtonProps,
    hideConfirmButton = false,
    hideCancelButton = false,
    afterOpen,
    afterClose,
    getPopupContainer: customGetPopupContainer,
    mountOnEnter = true,
    unmountOnExit = true,
    escToExit = true,
    autoFocus = true,
    focusLock = true,
    simple = false,
    closeIcon,
    modalRender,
  } = config;

  const containerId = `confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const container = createDialogContainer(containerId);

  const [visible, setVisible] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 关闭弹窗
  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      afterClose?.();
      destroyDialogContainer(containerId);
    }, 300);
  }, [containerId, afterClose]);

  // 销毁弹窗
  const destroy = useCallback(() => {
    setVisible(false);
    destroyDialogContainer(containerId);
  }, [containerId]);

  // 弹窗打开后的回调
  useEffect(() => {
    if (visible) {
      afterOpen?.();
    }
  }, [visible, afterOpen]);

  // 更新弹窗配置
  const update = useCallback((newConfig: Partial<ConfirmDialogConfig>) => {
    // 简化处理
  }, []);

  // 确认处理
  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      setConfirmLoading(true);
      try {
        const result = await onConfirm();
        if (result !== false) {
          close();
        }
      } finally {
        setConfirmLoading(false);
      }
    } else {
      close();
    }
  }, [onConfirm, close]);

  // 取消处理
  const handleCancel = useCallback(() => {
    onCancel?.();
    close();
  }, [onCancel, close]);

  // 渲染底部按钮
  const renderFooter = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      {!hideCancelButton && (
        <Button onClick={handleCancel} {...cancelButtonProps}>
          {cancelText}
        </Button>
      )}
      {!hideConfirmButton && (
        <Button
          type={confirmButtonType}
          status={confirmButtonStatus}
          loading={confirmLoading}
          onClick={handleConfirm}
          {...confirmButtonProps}
        >
          {confirmText}
        </Button>
      )}
    </div>
  );

  // 渲染弹窗
  const ConfirmComponent = () => (
    <Modal
      title={title}
      visible={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
      mask={mask}
      maskClosable={maskClosable}
      closable={closable}
      alignCenter={alignCenter}
      style={{
        width,
        ...modalStyle,
      }}
      className={modalClassName}
      maskStyle={maskStyle}
      footer={renderFooter()}
      getPopupContainer={customGetPopupContainer || (() => container)}
      mountOnEnter={mountOnEnter}
      unmountOnExit={unmountOnExit}
      escToExit={escToExit}
      autoFocus={autoFocus}
      focusLock={focusLock}
      simple={simple}
      closeIcon={closeIcon}
      modalRender={modalRender}
    >
      {content}
    </Modal>
  );

  // 渲染到容器
  const root = document.createElement('div');
  container.appendChild(root);

  // 使用 React 渲染
  const ReactDOM = require('react-dom');
  ReactDOM.render(<ConfirmComponent />, root);

  return {
    update,
    close,
    destroy,
  };
};

/**
 * 打开信息提示弹窗
 * @param config 提示配置
 * @returns 弹窗控制对象
 */
export const info = (config: ConfirmDialogConfig): DialogReturnProps => confirm({ ...config });

/**
 * 打开成功提示弹窗
 * @param config 提示配置
 * @returns 弹窗控制对象
 */
export const success = (config: ConfirmDialogConfig): DialogReturnProps => confirm({ ...config });

/**
 * 打开警告提示弹窗
 * @param config 提示配置
 * @returns 弹窗控制对象
 */
export const warning = (config: ConfirmDialogConfig): DialogReturnProps => confirm({ ...config });

/**
 * 打开错误提示弹窗
 * @param config 提示配置
 * @returns 弹窗控制对象
 */
export const error = (config: ConfirmDialogConfig): DialogReturnProps => confirm({ ...config });

/**
 * 弹窗工具对象
 */
export const DialogUtils = {
  open: openDialog,
  confirm,
  info,
  success,
  warning,
  error,
};

export default DialogUtils;
