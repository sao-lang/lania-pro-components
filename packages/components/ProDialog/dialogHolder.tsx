/**
 * 弹窗持有器（Dialog Holder）
 *
 * 用于命令式创建和管理弹窗的核心模块。
 * 通过 ReactDOM.createRoot 动态渲染弹窗组件到 body 中，
 * 提供 open / close / update / destroy 等命令式操作 API。
 *
 * 主要导出：
 * - createDialogHolder: 创建通用弹窗持有器
 * - renderConfirmDialog: 渲染确认对话框（带图标和类型的快捷弹窗）
 *
 * 这种模式避免了需要在 JSX 中预先声明弹窗组件，
 * 适合在事件回调、异步操作等场景中直接弹出弹窗。
 */

import { deepMerge } from '@lania-pro-components/utils';
import React, { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { createImperativeInstance } from '@lania-pro-components/shared';
import { IconInfoCircle, IconCheckCircle, IconExclamationCircle, IconCloseCircle } from '@arco-design/web-react/icon';
import type {
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  ProDialogInstance,
  ProDialogProps,
} from './types';
import { ProDialog } from './index';

/**
 * DialogHolder 组件的内部 Props
 */
interface DialogHolderProps<TValues, T> {
  /** 弹窗配置 */
  config: OpenDialogConfig<TValues, T>;
  /** 弹窗关闭时的回调 */
  onClose: () => void;
}

/**
 * 弹窗持有器内部组件
 *
 * 负责管理单个命令式弹窗的渲染和状态。
 * 通过 React state 管理弹窗的 visible 状态和动态配置。
 *
 * @template TValues - 表单值类型
 * @template T - 表格行数据类型
 */
function DialogHolder<TValues, T>({ config, onClose }: DialogHolderProps<TValues, T>) {
  // 弹窗可见状态
  const [visible, setVisible] = useState(true);
  // 弹窗动态配置（支持运行时 update）
  const [currentConfig, setCurrentConfig] = useState<OpenDialogConfig<TValues, T>>(config);
  // 弹窗实例引用
  const dialogRef = useRef<ProDialogInstance<TValues, T> | null>(null);

  /** 关闭弹窗处理 */
  const handleClose = useCallback(() => {
    setVisible(false);
    currentConfig.onCancel?.();
    onClose();
  }, [currentConfig, onClose]);

  /** 确认按钮点击：触发表单提交 */
  const handleOk = useCallback(() => {
    const instance = dialogRef.current;
    if (instance) {
      instance.submitForm?.();
    }
  }, [currentConfig]);

  /** 更新弹窗配置（运行时动态修改） */
  const handleUpdate = useCallback((newConfig: Partial<ProDialogProps<TValues, T>>) => {
    setCurrentConfig(
      (prev) =>
        deepMerge(prev as Record<string, unknown>, newConfig as Record<string, unknown>) as OpenDialogConfig<
          TValues,
          T
        >,
    );
  }, []);

  // 将 handleUpdate 挂载到弹窗实例的 update 方法上
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
      {/* 支持 content 为函数（传入弹窗实例）或 ReactNode */}
      {typeof content === 'function' ? content(dialogRef.current!) : content}
    </ProDialog>
  );
}

/**
 * 创建弹窗持有器（命令式打开弹窗的核心 API）
 *
 * 动态创建一个挂载到 body 的弹窗组件，返回可操作的控制对象。
 * 适用于需要在事件回调、工具函数等非 JSX 上下文中弹出弹窗的场景。
 *
 * @param config - 弹窗配置（与 ProDialog 的 Props 一致，但 content 支持函数形式）
 * @returns 弹窗控制对象，包含 update / close / destroy 方法
 *
 * @example
 * ```ts
 * // 打开一个表单弹窗
 * const dialog = createDialogHolder({
 *   title: '新增用户',
 *   schemas: [...],
 *   onSubmit: async (values) => {
 *     await createUser(values);
 *     dialog.close();
 *   },
 *   content: (instance) => <div>自定义内容</div>,
 * });
 *
 * // 运行时更新配置
 * dialog.update({ title: '编辑用户' });
 *
 * // 关闭弹窗
 * dialog.close();
 *
 * // 销毁弹窗（移除 DOM）
 * dialog.destroy();
 * ```
 */
export function createDialogHolder<TValues, T>(config: OpenDialogConfig<TValues, T>): DialogReturnProps {
  // 使用 createImperativeInstance 管理命令式渲染
  const manager = createImperativeInstance<{ config: OpenDialogConfig<TValues, T>; onClose: () => void }>(
    ({ config: cfg, onClose }) => (
      <DialogHolder<TValues, T> config={cfg as OpenDialogConfig<TValues, T>} onClose={onClose} />
    ),
  );

  const dialogHandle: { current: { close: () => void } } = { current: { close: () => {} } };
  dialogHandle.current = manager.open({ config, onClose: () => dialogHandle.current.close() });

  const update: DialogReturnProps['update'] = (newConfig) => {
    dialogHandle.current = manager.open({
      config: { ...config, ...newConfig } as OpenDialogConfig<TValues, T>,
      onClose: () => dialogHandle.current.close(),
    });
  };

  const close = () => {
    dialogHandle.current.close();
  };

  const destroy = () => {
    manager.closeAll();
  };

  return {
    update,
    close,
    destroy,
  };
}

/**
 * 渲染确认对话框
 *
 * 基于 createDialogHolder 封装的上层 API，预置了不同类型的图标和默认配置。
 * 支持 confirm / info / success / warning / error 五种类型。
 *
 * @param config - 确认对话框配置
 * @returns 弹窗控制对象
 *
 * @example
 * ```ts
 * // 确认对话框
 * renderConfirmDialog({
 *   type: 'confirm',
 *   title: '确认删除',
 *   content: '删除后无法恢复，确定要继续吗？',
 *   onConfirm: async () => { await deleteItem(); },
 * });
 *
 * // 成功提示
 * renderConfirmDialog({
 *   type: 'success',
 *   title: '操作成功',
 *   content: '数据已成功保存',
 * });
 * ```
 */
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

  /** 根据类型获取对应的默认图标 */
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

  /** 渲染图标 + 内容的组合布局 */
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

  // 非 confirm 类型（info/success/warning/error）使用简洁模式并隐藏取消按钮
  const isSimple = type !== 'confirm';
  const hideCancel = type !== 'confirm';

  // 初始化当前状态变量（用于 update 时追踪最新值）
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
      // 追踪最新的 icon / content / okText / cancelText
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
