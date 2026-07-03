/**
 * ProDialog 反馈组件模块
 *
 * 提供与弹窗相关的轻量级反馈组件，封装了 Arco Design 的 Popconfirm、Message、Notification：
 * - ProPopconfirm: 气泡确认框（声明式 + 命令式）
 * - ProMessage: 全局消息提示（info / success / warning / error / loading）
 * - ProNotification: 全局通知提醒（带标题和内容的结构化通知）
 * - ProNotify: 简化版通知 API（双参数调用）
 *
 * 这些组件作为 ProDialog 的静态属性挂载，可通过 `ProDialog.message.success('操作成功')` 等方式调用。
 */
import React from 'react';
import { Popconfirm, Message, Notification, Modal } from '@arco-design/web-react';
import type { PopconfirmConfig, MessageConfig, NotificationConfig, MessageReturn, NotificationReturn } from './types';

/**
 * ProDialog Popconfirm 气泡确认框
 * @example
 * ```tsx
 * // 基础用法
 * <ProDialog.Popconfirm
 *   title="确认删除？"
 *   content="删除后无法恢复"
 *   onConfirm={() => handleDelete()}
 * >
 *   <Button>删除</Button>
 * </ProDialog.Popconfirm>
 *
 * // 命令式调用
 * ProDialog.popconfirm({
 *   title: '确认删除？',
 *   content: '删除后无法恢复',
 *   onConfirm: () => handleDelete(),
 * });
 * ```
 */
export const ProPopconfirm: React.FC<PopconfirmConfig> = ({
  title,
  content,
  okText = '确认',
  cancelText = '取消',
  okButtonProps,
  cancelButtonProps,
  onConfirm,
  onCancel,
  position = 'top',
  trigger = 'click',
  disabled = false,
  icon,
  style,
  className,
  children,
}) => (
  <Popconfirm
    title={title}
    content={content}
    okText={okText}
    cancelText={cancelText}
    okButtonProps={okButtonProps}
    cancelButtonProps={cancelButtonProps}
    onOk={onConfirm}
    onCancel={onCancel}
    position={position}
    trigger={trigger}
    disabled={disabled}
    icon={icon}
    style={style}
    className={className}
  >
    {children}
  </Popconfirm>
);

/**
 * 命令式 Popconfirm
 * 由于 Popconfirm 是基于子元素触发的，命令式调用需要传入目标元素或手动控制
 */
export function showPopconfirm(config: PopconfirmConfig): void {
  // Popconfirm 通常需要绑定到具体元素上，命令式调用场景较少
  // 这里提供一个基于 Modal.confirm 的替代方案

  const { title, content, okText = '确认', cancelText = '取消', onConfirm, onCancel, icon } = config;

  Modal.confirm({
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
        {icon && (
          <div
            style={{
              fontSize: 20,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ lineHeight: 1.5, display: 'flex', alignItems: 'center' }}>{content}</div>
      </div>
    ),
    okText,
    cancelText,
    onOk: onConfirm as ((e?: MouseEvent) => void | Promise<any>) | undefined,
    onCancel,
  });
}

/**
 * ProDialog Message 全局消息
 * @example
 * ```tsx
 * // 基础用法
 * ProDialog.message.info('这是一条消息');
 * ProDialog.message.success('操作成功');
 * ProDialog.message.warning('警告提示');
 * ProDialog.message.error('操作失败');
 * ProDialog.message.loading('加载中...');
 *
 * // 自定义配置
 * ProDialog.message.open({
 *   content: '自定义消息',
 *   type: 'success',
 *   duration: 5000,
 *   closable: true,
 * });
 * ```
 */
export const ProMessage = {
  /**
   * 打开消息提示
   */
  open: (config: MessageConfig): MessageReturn => {
    const { content, type = 'info', duration = 3000, closable = false, onClose, icon } = config;

    const messageType = type === 'loading' ? 'loading' : type;

    const closeFn = Message[messageType]({
      content,
      duration,
      closable,
      onClose,
      icon,
    });

    return {
      close: closeFn,
    };
  },

  /**
   * 信息提示
   */
  info: (content: React.ReactNode, duration?: number): MessageReturn =>
    ProMessage.open({
      content,
      type: 'info',
      duration,
    }),

  /**
   * 成功提示
   */
  success: (content: React.ReactNode, duration?: number): MessageReturn =>
    ProMessage.open({
      content,
      type: 'success',
      duration,
    }),

  /**
   * 警告提示
   */
  warning: (content: React.ReactNode, duration?: number): MessageReturn =>
    ProMessage.open({
      content,
      type: 'warning',
      duration,
    }),

  /**
   * 错误提示
   */
  error: (content: React.ReactNode, duration?: number): MessageReturn =>
    ProMessage.open({
      content,
      type: 'error',
      duration,
    }),

  /**
   * 加载中提示
   */
  loading: (content: React.ReactNode = '加载中...', showOverlay?: boolean): MessageReturn =>
    ProMessage.open({
      content,
      type: 'loading',
      duration: 0, // loading 不自动关闭
      showOverlay,
    }),

  /**
   * 关闭所有消息
   */
  clear: (): void => {
    Message.clear();
  },

  /**
   * 配置全局默认参数
   */
  config: (options: Partial<MessageConfig>): void => {
    Message.config(options);
  },
};

/**
 * ProDialog Notification 通知提醒
 * @example
 * ```tsx
 * // 基础用法
 * ProDialog.notification.info({
 *   title: '提示',
 *   content: '这是一条通知',
 * });
 * ProDialog.notification.success({
 *   title: '成功',
 *   content: '操作已完成',
 * });
 *
 * // 命令式快捷方法
 * ProDialog.notify.info('提示', '这是一条通知');
 * ProDialog.notify.success('成功', '操作已完成');
 * ```
 */
export const ProNotification = {
  /**
   * 打开通知
   */
  open: (config: NotificationConfig): NotificationReturn => {
    const {
      title,
      content,
      type = 'info',
      position = 'topRight',
      duration = 4500,
      closable = true,
      onClose,
      icon,
      btn,
      style,
      className,
    } = config;

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    Notification[type]({
      id,
      title,
      content,
      position,
      duration,
      closable,
      onClose,
      icon,
      btn,
      style,
      className,
    });

    return {
      close: () => {
        Notification.remove(id);
      },
    };
  },

  /**
   * 信息通知
   */
  info: (config: Omit<NotificationConfig, 'type'>): NotificationReturn =>
    ProNotification.open({ ...config, type: 'info' }),

  /**
   * 成功通知
   */
  success: (config: Omit<NotificationConfig, 'type'>): NotificationReturn =>
    ProNotification.open({ ...config, type: 'success' }),

  /**
   * 警告通知
   */
  warning: (config: Omit<NotificationConfig, 'type'>): NotificationReturn =>
    ProNotification.open({ ...config, type: 'warning' }),

  /**
   * 错误通知
   */
  error: (config: Omit<NotificationConfig, 'type'>): NotificationReturn =>
    ProNotification.open({ ...config, type: 'error' }),

  /**
   * 移除所有通知
   */
  clear: (): void => {
    Notification.clear();
  },

  /**
   * 配置全局默认参数
   */
  config: (options: Partial<NotificationConfig>): void => {
    Notification.config(options);
  },
};

/**
 * 快捷通知方法（简化版 API）
 */
export const ProNotify = {
  /**
   * 信息通知
   */
  info: (title: React.ReactNode, content: React.ReactNode): NotificationReturn =>
    ProNotification.info({ title, content }),

  /**
   * 成功通知
   */
  success: (title: React.ReactNode, content: React.ReactNode): NotificationReturn =>
    ProNotification.success({ title, content }),

  /**
   * 警告通知
   */
  warning: (title: React.ReactNode, content: React.ReactNode): NotificationReturn =>
    ProNotification.warning({ title, content }),

  /**
   * 错误通知
   */
  error: (title: React.ReactNode, content: React.ReactNode): NotificationReturn =>
    ProNotification.error({ title, content }),

  /**
   * 移除所有通知
   */
  clear: (): void => {
    Notification.clear();
  },
};
