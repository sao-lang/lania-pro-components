/**
 * ProDialog 组件 — 基于 Arco Design 的高级弹窗组件
 *
 * 支持三种内容模式：
 * 1. **普通模式**（children）：渲染任意子内容，适合简单弹窗
 * 2. **表单模式**（schemas + formProps）：自动渲染 ProForm，支持 Schema 驱动
 * 3. **表格选择模式**（columns + request/onSelect）：渲染 ProTable，用于弹窗内数据选择
 *
 * 支持两种展示模式：
 * - modal: Arco Design Modal（模态框，居中弹出，支持拖拽/缩放）
 * - drawer: Arco Design Drawer（抽屉，从侧边滑出）
 *
 * 高级特性：
 * - 拖拽（draggable）、调整大小（resizable）、全屏（fullscreen）
 * - 自定义按钮组（buttons）、确认关闭拦截（confirmOnClose）
 * - 实例注册（instance prop + InstanceRegistry）
 * - ref 暴露完整的弹窗控制 API
 *
 * 还提供命令式调用 API：
 * - ProDialog.open(config): 打开普通弹窗
 * - ProDialog.form(config): 打开表单弹窗
 * - ProDialog.table(config): 打开表格弹窗
 * - ProDialog.confirm(config): 打开确认对话框
 * - ProDialog.message: 全局消息提示（info/success/warning/error/loading）
 * - ProDialog.notification: 全局通知提醒
 * - ProDialog.popconfirm: 气泡确认框
 */
import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { Modal, Drawer } from '@arco-design/web-react';
import type {
  ProDialogProps,
  ProDialogInstance,
  DialogState,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  FormDialogProps,
  TableDialogProps,
} from './types';
import { instanceRegistry } from './instanceRegistry';
import { renderConfirmDialog, createDialogHolder } from './dialogHolder';
import { ProPopconfirm, ProMessage, ProNotification, ProNotify, showPopconfirm } from './feedback';
import { useDialogInstance } from './useDialogInstance';

/**
 * ProDialog 组件 - 基于 Arco Design 的高级弹窗组件
 * @template TValues 表单值类型
 * @template T 表格数据类型
 * @example
 * ```tsx
 * // 基础用法
 * <ProDialog
 *   title="提示"
 *   visible={visible}
 *   onOk={() => setVisible(false)}
 *   onCancel={() => setVisible(false)}
 * >
 *   内容
 * </ProDialog>
 *
 * // 表单弹窗
 * <ProDialog
 *   title="编辑用户"
 *   mode="modal"
 *   schemas={[
 *     { name: 'name', label: '姓名', component: 'Input', required: true },
 *   ]}
 *   onSubmit={async (values) => {
 *     await saveUser(values);
 *     return true; // 返回 true 自动关闭
 *   }}
 * />
 *
 * // 表格选择弹窗
 * <ProDialog
 *   title="选择用户"
 *   mode="drawer"
 *   columns={[{ title: '姓名', dataIndex: 'name' }]}
 *   request={fetchUsers}
 *   onSelect={(keys, rows) => {
 *     console.log(keys, rows);
 *     return true;
 *   }}
 * />
 * ```
 */
const createProDialogComponent = <
  TValues extends Record<string, unknown> = Record<string, unknown>,
  T extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const Component = forwardRef<ProDialogInstance<TValues, T>, ProDialogProps<TValues, T>>(
    (
      {
        // 基础配置
        mode = 'modal',
        size = 'medium',
        width,
        height,
        visible: visibleProp,
        defaultVisible = false,
        title: titleProp,
        subTitle,
        titleIcon,
        closable = true,
        closeIcon,
        mask = true,
        maskClosable = true,
        maskStyle,
        style,
        className,
        wrapStyle,
        wrapClassName,
        bodyStyle,
        headerStyle,
        footerStyle,
        showFooter = true,
        footer: footerProp,
        footerPosition = 'right',
        okText = '确认',
        cancelText = '取消',
        okButtonProps,
        cancelButtonProps,
        hideCancel = false,
        confirmLoading: confirmLoadingProp = false,
        showOk = true,
        showCancel = true,
        extraButtons = [],
        buttons,
        afterOpen,
        afterClose,
        onVisibleChange,
        onOk,
        onCancel,
        onClose,
        escToExit = true,
        mountOnEnter = true,
        unmountOnExit = false,
        focusLock = true,
        autoFocus = true,
        getPopupContainer,
        getChildrenPopupContainer,
        instance,
        dialogRender,
        dialogRef,
        children,

        // Drawer 配置
        placement = 'right',

        // 高级功能
        confirmOnClose = false,
        confirmTitle = '确认关闭',
        confirmContent = '确定要关闭弹窗吗？未保存的数据将丢失。',
        isEditing,
        draggable = false,
        resizable = false,
        fullscreen: fullscreenProp = false,
        showFullscreen = false,
        zIndex,
        simple = false,
        alignCenter = true,

        // 表单配置
        formProps,
        schemas,
        initialValues,
        onFinish,
        onSubmit,
        beforeSubmit,
        onValuesChange,

        // 表格配置
        tableProps,
        columns,
        request,
        dataSource,
        selectionType = 'checkbox',
        defaultSelectedKeys,
        defaultSelectedRows,
        onSelectionChange,
        onSelect,
        rowKey = 'id',
      },
      ref,
    ) => {
      const [state, setState] = useState<DialogState>({
        visible: defaultVisible,
        confirmLoading: confirmLoadingProp,
        confirmDisabled: false,
        title: titleProp || '',
        fullscreen: fullscreenProp,
        contentLoading: false,
      });

      const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(defaultSelectedKeys || []);
      const [selectedRows, setSelectedRows] = useState<T[]>(defaultSelectedRows || []);

      const isControlled = visibleProp !== undefined;
      const visible = isControlled ? visibleProp : state.visible;

      useEffect(() => {
        if (confirmLoadingProp !== state.confirmLoading) {
          setState((prev) => ({ ...prev, confirmLoading: confirmLoadingProp }));
        }
      }, [confirmLoadingProp, state.confirmLoading]);

      useEffect(() => {
        if (titleProp !== undefined && titleProp !== state.title) {
          setState((prev) => ({ ...prev, title: titleProp }));
        }
      }, [titleProp, state.title]);

      useEffect(() => {
        if (fullscreenProp !== state.fullscreen) {
          setState((prev) => ({ ...prev, fullscreen: fullscreenProp }));
        }
      }, [fullscreenProp, state.fullscreen]);

      const dialogInstanceRef = useRef<ProDialogInstance<TValues, T>>(null);

      const {
        dialogInstance,
        handleOk,
        handleClose,
        renderFooter,
        renderContent,
        computedWidth,
        computedHeight,
        dragOffset,
        resizeSize,
        renderTitleWithDrag,
        handleResizeStart,
      } = useDialogInstance<TValues, T>({
        state,
        setState,
        titleProp,
        fullscreenProp,
        defaultSelectedKeys,
        defaultSelectedRows,
        selectedRowKeys,
        setSelectedRowKeys,
        selectedRows,
        setSelectedRows,
        mode,
        size,
        width,
        height,
        subTitle,
        titleIcon,
        footerStyle,
        footerPosition,
        showFooter,
        footer: footerProp,
        okText,
        cancelText,
        okButtonProps,
        cancelButtonProps,
        hideCancel,
        showOk,
        showCancel,
        extraButtons,
        buttons,
        showFullscreen,
        afterClose,
        onVisibleChange,
        onOk,
        onCancel,
        onClose,
        confirmOnClose,
        confirmTitle,
        confirmContent,
        isEditing,
        draggable,
        resizable,
        schemas,
        formProps,
        initialValues,
        onFinish,
        onSubmit,
        beforeSubmit,
        onValuesChange,
        columns,
        tableProps,
        request,
        dataSource,
        selectionType,
        onSelectionChange,
        onSelect,
        rowKey,
        children,
        bodyStyle,
        closeDialog: () => {},
        isControlled,
        destroyDialog: () => {},
      });

      useImperativeHandle(ref, () => dialogInstance, [dialogInstance]);

      useEffect(() => {
        dialogInstanceRef.current = dialogInstance;
        if (typeof dialogRef === 'function') {
          dialogRef(dialogInstance);
        } else if (dialogRef) {
          dialogRef.current = dialogInstance;
        }
      }, [dialogInstance, dialogRef]);

      useEffect(() => {
        if (instance && dialogInstanceRef.current) {
          instanceRegistry.register(instance, dialogInstanceRef.current as ProDialogInstance);
          return () => {
            instanceRegistry.unregister(instance);
          };
        }
      }, [instance]);

      const renderDialog = () => {
        if (mode === 'drawer') {
          return (
            <Drawer
              visible={visible}
              title={renderTitleWithDrag()}
              footer={renderFooter()}
              closable={closable}
              closeIcon={closeIcon}
              mask={mask}
              maskClosable={maskClosable}
              maskStyle={maskStyle}
              style={{
                ...style,
                maxWidth: '100vw',
                maxHeight: '100vh',
              }}
              className={className}
              bodyStyle={bodyStyle}
              headerStyle={headerStyle}
              escToExit={escToExit}
              mountOnEnter={mountOnEnter}
              unmountOnExit={unmountOnExit}
              focusLock={focusLock}
              autoFocus={autoFocus}
              getPopupContainer={getPopupContainer}
              getChildrenPopupContainer={getChildrenPopupContainer}
              afterOpen={afterOpen}
              afterClose={afterClose}
              onCancel={handleClose}
              confirmLoading={state.confirmLoading}
              width={computedWidth}
              height={computedHeight}
              placement={placement}
              zIndex={zIndex}
            >
              {renderContent()}
            </Drawer>
          );
        }

        return (
          <Modal
            visible={visible}
            title={renderTitleWithDrag()}
            footer={renderFooter()}
            closable={closable}
            closeIcon={closeIcon}
            mask={mask}
            maskClosable={maskClosable}
            maskStyle={maskStyle}
            style={{
              ...style,
              maxWidth: '100vw',
              maxHeight: '100vh',
              width: resizeSize.width > 0 ? resizeSize.width : computedWidth,
              height: resizeSize.height > 0 ? resizeSize.height : undefined,
              transform: draggable && !state.fullscreen ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
            }}
            className={className}
            wrapStyle={{
              ...wrapStyle,
              position: draggable && !state.fullscreen ? 'absolute' : undefined,
            }}
            wrapClassName={wrapClassName}
            escToExit={escToExit}
            mountOnEnter={mountOnEnter}
            unmountOnExit={unmountOnExit}
            focusLock={focusLock}
            autoFocus={autoFocus}
            getPopupContainer={getPopupContainer}
            getChildrenPopupContainer={getChildrenPopupContainer}
            afterOpen={afterOpen}
            afterClose={afterClose}
            onCancel={handleClose}
            confirmLoading={state.confirmLoading}
            simple={simple}
            alignCenter={draggable && !state.fullscreen ? false : alignCenter}
            modalRender={dialogRender}
            onOk={handleOk}
          >
            <div
              style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {bodyStyle ? <div style={bodyStyle}>{renderContent()}</div> : renderContent()}
              {resizable && !state.fullscreen && (
                <div
                  className='pro-dialog-resize-handle'
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 12,
                    height: 12,
                    cursor: 'se-resize',
                    background: 'linear-gradient(135deg, transparent 50%, var(--color-border) 50%)',
                    borderRight: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  onMouseDown={handleResizeStart}
                />
              )}
            </div>
          </Modal>
        );
      };

      return renderDialog();
    },
  );

  Component.displayName = 'ProDialog';
  return Component;
};

/**
 * ProDialog 组件
 * @template TValues 表单值类型
 * @template T 表格数据类型
 */
export const ProDialog = createProDialogComponent() as unknown as ProDialogComponentType;

// 挂载命令式方法
ProDialog.open = <TValues, T>(config: OpenDialogConfig<TValues, T>): DialogReturnProps => createDialogHolder(config);

ProDialog.confirm = (config: ConfirmDialogConfig): DialogReturnProps =>
  renderConfirmDialog({ ...config, type: 'confirm' });

ProDialog.info = (config: Omit<ConfirmDialogConfig, 'type'>): DialogReturnProps =>
  renderConfirmDialog({ ...config, type: 'info' });

ProDialog.success = (config: Omit<ConfirmDialogConfig, 'type'>): DialogReturnProps =>
  renderConfirmDialog({ ...config, type: 'success' });

ProDialog.warning = (config: Omit<ConfirmDialogConfig, 'type'>): DialogReturnProps =>
  renderConfirmDialog({ ...config, type: 'warning' });

ProDialog.error = (config: Omit<ConfirmDialogConfig, 'type'>): DialogReturnProps =>
  renderConfirmDialog({ ...config, type: 'error' });

ProDialog.form = (<TValues extends Record<string, unknown>>(
  config: Omit<OpenDialogConfig<TValues, unknown>, 'schemas' | 'formProps'> &
    FormDialogProps<TValues> & { title: React.ReactNode },
): DialogReturnProps =>
  createDialogHolder({
    ...config,
    schemas: config.schemas,
    formProps: config.formProps,
    onSubmit: config.onSubmit || config.onFinish,
  })) as ProDialogComponentType['form'];

ProDialog.table = (<TRow extends Record<string, unknown>>(
  config: Omit<OpenDialogConfig<unknown, TRow>, 'columns' | 'tableProps'> &
    TableDialogProps<TRow> & { title: React.ReactNode },
): DialogReturnProps =>
  createDialogHolder({
    ...config,
    columns: config.columns,
    tableProps: config.tableProps,
  })) as ProDialogComponentType['table'];

// ===== 挂载反馈类组件 =====

/**
 * Popconfirm 气泡确认框组件
 * @example
 * ```tsx
 * <ProDialog.Popconfirm
 *   title="确认删除？"
 *   content="删除后无法恢复"
 *   onConfirm={() => handleDelete()}
 * >
 *   <Button>删除</Button>
 * </ProDialog.Popconfirm>
 * ```
 */
ProDialog.Popconfirm = ProPopconfirm;

/**
 * 命令式 Popconfirm（基于 Modal.confirm 实现）
 * @example
 * ```tsx
 * ProDialog.popconfirm({
 *   title: '确认删除？',
 *   content: '删除后无法恢复',
 *   onConfirm: () => handleDelete(),
 * });
 * ```
 */
ProDialog.popconfirm = showPopconfirm;

/**
 * Message 全局消息
 * @example
 * ```tsx
 * ProDialog.message.success('操作成功');
 * ProDialog.message.error('操作失败');
 * ProDialog.message.loading('加载中...');
 * ```
 */
ProDialog.message = ProMessage;

/**
 * Notification 通知提醒
 * @example
 * ```tsx
 * ProDialog.notification.info({
 *   title: '提示',
 *   content: '这是一条通知',
 * });
 * ```
 */
ProDialog.notification = ProNotification;

/**
 * Notify 快捷通知（简化版 API）
 * @example
 * ```tsx
 * ProDialog.notify.success('成功', '操作已完成');
 * ProDialog.notify.error('错误', '操作失败');
 * ```
 */
ProDialog.notify = ProNotify;

import type { ProDialogComponent as ProDialogComponentType } from './types';
