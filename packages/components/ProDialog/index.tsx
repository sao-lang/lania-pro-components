/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect, useMemo } from 'react';
import { Modal, Drawer, Button, Space, Spin } from '@arco-design/web-react';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import type {
  ProDialogProps,
  ProDialogInstance,
  DialogState,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
} from './types';
import { ProForm, ProFormInstance } from '../ProFormN';
import { ProTableN, ProTableActionType } from '../ProTableN';
import { instanceRegistry } from './instanceRegistry';
import { renderConfirmDialog, createDialogHolder } from './dialogHolder';
import { getSizeWidth, getFooterJustify } from './utils';
import { ProPopconfirm, ProMessage, ProNotification, ProNotify, showPopconfirm } from './feedback';

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
const ProDialogComponent = <
  TValues extends Record<string, any> = Record<string, any>,
  T extends Record<string, any> = Record<string, any>,
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
        afterOpen,
        afterClose,
        onVisibleChange,
        onOk,
        onCancel,
        _onClose,
        escToExit = true,
        mountOnEnter = true,
        unmountOnExit = false,
        focusLock = true,
        autoFocus = true,
        getPopupContainer,
        getChildrenPopupContainer,
        instance,
        dialogRender,
        children,

        // Drawer 配置
        placement = 'right',

        // 高级功能
        confirmOnClose = false,
        confirmTitle = '确认关闭',
        confirmContent = '确定要关闭弹窗吗？未保存的数据将丢失。',
        isEditing,
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
      // 状态管理
      const [state, setState] = useState<DialogState>({
        visible: defaultVisible,
        confirmLoading: confirmLoadingProp,
        confirmDisabled: false,
        title: titleProp || '',
        fullscreen: fullscreenProp,
        contentLoading: false,
      });

      // Refs
      const formRef = useRef<ProFormInstance<TValues>>(null);
      const tableActionRef = useRef<ProTableActionType>(null);
      const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(defaultSelectedKeys || []);
      const [selectedRows, setSelectedRows] = useState<T[]>(defaultSelectedRows || []);

      // 受控模式处理
      const isControlled = visibleProp !== undefined;
      const visible = isControlled ? visibleProp : state.visible;

      // 同步外部 confirmLoading
      useEffect(() => {
        if (confirmLoadingProp !== state.confirmLoading) {
          setState((prev) => ({ ...prev, confirmLoading: confirmLoadingProp }));
        }
      }, [confirmLoadingProp, state.confirmLoading]);

      // 同步外部 title
      useEffect(() => {
        if (titleProp !== undefined && titleProp !== state.title) {
          setState((prev) => ({ ...prev, title: titleProp }));
        }
      }, [titleProp, state.title]);

      // 同步外部 fullscreen
      useEffect(() => {
        if (fullscreenProp !== state.fullscreen) {
          setState((prev) => ({ ...prev, fullscreen: fullscreenProp }));
        }
      }, [fullscreenProp, state.fullscreen]);

      // 计算实际宽度
      const finalWidth = useMemo(() => {
        if (state.fullscreen) {
          return '100%';
        }
        if (width) {
          return width;
        }
        return getSizeWidth(size);
      }, [width, size, state.fullscreen]);

      const finalHeight = useMemo(() => {
        if (state.fullscreen) {
          return '100%';
        }
        return height;
      }, [height, state.fullscreen]);

      // 使用 ref 存储 dialogInstance，避免循环依赖
      const dialogInstanceRef = useRef<ProDialogInstance<TValues, T>>(null);

      // 弹窗实例方法
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const dialogInstance: ProDialogInstance<TValues, T> = {
        open: () => {
          if (!isControlled) {
            setState((prev) => ({ ...prev, visible: true }));
          }
          onVisibleChange?.(true);
        },
        close: () => {
          handleClose();
        },
        toggle: () => {
          if (visible) {
            dialogInstance.close();
          } else {
            dialogInstance.open();
          }
        },
        setTitle: (title) => {
          setState((prev) => ({ ...prev, title }));
        },
        setConfirmLoading: (loading) => {
          setState((prev) => ({ ...prev, confirmLoading: loading }));
        },
        setConfirmDisabled: (disabled) => {
          setState((prev) => ({ ...prev, confirmDisabled: disabled }));
        },
        setLoading: (loading) => {
          setState((prev) => ({ ...prev, contentLoading: loading }));
        },
        getFormInstance: () => formRef.current || undefined,
        getTableAction: () => tableActionRef.current || undefined,
        update: (config) => {
          // 更新配置（通过重新渲染实现）
          if (config.title !== undefined) {
            setState((prev) => ({ ...prev, title: config.title }));
          }
        },
        destroy: () => {
          handleClose();
        },

        // ===== 表单快捷操作方法 =====
        setFormValues: (values) => {
          formRef.current?.setFieldsValue(values);
        },
        getFormValues: (nameList) => {
          const value = formRef.current?.getFieldsValue(nameList);
          const result: TValues = (value || {}) as TValues;
          return result;
        },
        setFormFieldValue: (name, value) => {
          formRef.current?.setFieldValue(name, value);
        },
        getFormFieldValue: (name) => formRef.current?.getFieldValue(name),
        resetForm: (nameList) => {
          formRef.current?.resetFields(nameList);
        },
        validateForm: () => {
          const promise = formRef.current?.validate();
          const result: Promise<TValues> = (promise || Promise.resolve({})) as Promise<TValues>;
          return result;
        },
        clearFormValidate: (name) => {
          formRef.current?.clearValidate(name);
        },
        setFormProps: (props) => {
          formRef.current?.setProps(props);
        },
        setFormSchemas: (newSchemas) => {
          formRef.current?.setSchemas(newSchemas);
        },
        submitForm: () => (formRef.current?.submit() as unknown as Promise<void>) || Promise.resolve(),

        // ===== 表格快捷操作方法 =====
        reloadTable: (resetPageIndex) => {
          tableActionRef.current?.reload(resetPageIndex);
        },
        reloadAndRestTable: () => {
          tableActionRef.current?.reloadAndRest();
        },
        resetTable: () => {
          tableActionRef.current?.reset();
        },
        clearTableSelection: () => {
          tableActionRef.current?.clearSelected();
        },
        setTableSelectedRows: (rows) => {
          tableActionRef.current?.setSelectedRows(rows);
        },
        setTableSelectedRowKeys: (keys) => {
          tableActionRef.current?.setSelectedRowKeys(keys);
        },
        getTableSelectedRows: () => tableActionRef.current?.getSelectedRows() || [],
        getTableSelectedRowKeys: () => tableActionRef.current?.getSelectedRowKeys() || [],
        getTablePagination: () =>
          tableActionRef.current?.getPagination() || {
            current: 1,
            pageSize: 20,
            total: 0,
          },
        setTablePagination: (pagination) => {
          tableActionRef.current?.setPagination(pagination);
        },
        getTableParams: () => tableActionRef.current?.getParams() || {},
        setTableParams: (params) => {
          tableActionRef.current?.setParams(params);
        },
      };

      // 暴露实例方法
      useImperativeHandle(ref, () => dialogInstance, [dialogInstance]);

      // 同步 dialogInstance 到 ref
      useEffect(() => {
        dialogInstanceRef.current = dialogInstance;
      }, [dialogInstance]);

      // 注册实例
      useEffect(() => {
        if (instance && dialogInstanceRef.current) {
          instanceRegistry.register(instance, dialogInstanceRef.current);
          return () => {
            instanceRegistry.unregister(instance);
          };
        }
      }, [instance]);

      // 关闭处理
      const handleClose = useCallback(() => {
        // 确认关闭
        if (confirmOnClose) {
          const editing = typeof isEditing === 'function' ? isEditing() : isEditing;
          if (editing) {
            Modal.confirm({
              title: confirmTitle,
              content: confirmContent,
              onOk: () => {
                if (!isControlled) {
                  setState((prev) => ({ ...prev, visible: false }));
                }
                onVisibleChange?.(false);
                onCancel?.();
              },
            });
            return;
          }
        }

        if (!isControlled) {
          setState((prev) => ({ ...prev, visible: false }));
        }
        onVisibleChange?.(false);
        onCancel?.();
      }, [confirmOnClose, isEditing, confirmTitle, confirmContent, isControlled, onVisibleChange, onCancel]);

      // 确认处理
      const handleOk = useCallback(async () => {
        // 表单模式
        if (schemas && formRef.current) {
          try {
            setState((prev) => ({ ...prev, confirmLoading: true }));
            const values = await formRef.current.validate();

            // 提交前校验
            if (beforeSubmit) {
              const canSubmit = await beforeSubmit(values);
              if (!canSubmit) {
                setState((prev) => ({ ...prev, confirmLoading: false }));
                return;
              }
            }

            // 执行提交
            // 注意：onSubmit 可能是异步的
            const result = await (onSubmit?.(values) ?? onFinish?.(values));

            // 返回 true 时自动关闭
            if (result === true) {
              handleClose();
            }
          } catch (error) {
            console.error('Form validation error:', error);
          } finally {
            setState((prev) => ({ ...prev, confirmLoading: false }));
          }
          return;
        }

        // 表格选择模式
        if (columns && onSelect) {
          setState((prev) => ({ ...prev, confirmLoading: true }));
          try {
            const result = await onSelect(selectedRowKeys, selectedRows);
            if (result === true) {
              handleClose();
            }
          } finally {
            setState((prev) => ({ ...prev, confirmLoading: false }));
          }
          return;
        }

        // 普通模式
        setState((prev) => ({ ...prev, confirmLoading: true }));
        try {
          await onOk?.();
        } finally {
          setState((prev) => ({ ...prev, confirmLoading: false }));
        }
      }, [
        schemas,
        columns,
        onSubmit,
        onFinish,
        beforeSubmit,
        onSelect,
        selectedRowKeys,
        selectedRows,
        onOk,
        handleClose,
      ]);

      // 全屏切换
      const toggleFullscreen = useCallback(() => {
        setState((prev) => ({ ...prev, fullscreen: !prev.fullscreen }));
      }, []);

      // 渲染标题
      const renderTitle = () => {
        if (!state.title && !subTitle && !titleIcon) {
          return null;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {titleIcon && <span>{titleIcon}</span>}
            <div>
              <div>{state.title}</div>
              {subTitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-3)',
                    fontWeight: 'normal',
                  }}
                >
                  {subTitle}
                </div>
              )}
            </div>
          </div>
        );
      };

      // 渲染底部按钮
      const renderFooter = () => {
        if (footerProp === null) {
          return null;
        }
        if (footerProp) {
          return footerProp;
        }
        if (!showFooter) {
          return null;
        }

        const buttons: React.ReactNode[] = [];

        // 自定义按钮
        extraButtons.forEach((btn) => {
          const disabledVal =
            typeof btn.disabled === 'function' ? btn.disabled({ dialog: dialogInstance }) : !!btn.disabled;
          buttons.push(
            <Button
              key={btn.key}
              type={btn.type}
              status={btn.status}
              loading={btn.loading}
              disabled={disabledVal}
              onClick={() => btn.onClick({ dialog: dialogInstance })}
              {...btn.props}
            >
              {btn.text}
            </Button>,
          );
        });

        // 全屏按钮
        if (showFullscreen) {
          buttons.push(
            <Button
              key='fullscreen'
              type='text'
              icon={state.fullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
              onClick={toggleFullscreen}
            />,
          );
        }

        // 取消按钮
        if (showCancel && !hideCancel) {
          buttons.push(
            <Button key='cancel' onClick={handleClose} disabled={state.confirmLoading} {...cancelButtonProps}>
              {cancelText}
            </Button>,
          );
        }

        // 确认按钮
        if (showOk) {
          buttons.push(
            <Button
              key='ok'
              type='primary'
              loading={state.confirmLoading}
              disabled={state.confirmDisabled}
              onClick={handleOk}
              {...okButtonProps}
            >
              {okText}
            </Button>,
          );
        }

        return (
          <div
            style={{
              display: 'flex',
              justifyContent: getFooterJustify(footerPosition),
              gap: 8,
              ...footerStyle,
            }}
          >
            <Space>{buttons}</Space>
          </div>
        );
      };

      // 渲染内容
      const renderContent = () => {
        // 表单模式
        if (schemas) {
          const body = (
            <ProForm
              ref={formRef}
              {...formProps}
              schemas={schemas}
              initialValues={initialValues}
              onValuesChange={onValuesChange}
              showButton={false}
              labelCol={formProps?.labelCol || (formProps?.layout === 'horizontal' ? { span: 4 } : undefined)}
              wrapperCol={formProps?.wrapperCol || (formProps?.layout === 'horizontal' ? { span: 20 } : undefined)}
            />
          );
          return (
            <div style={{ position: 'relative' }}>
              {body}
              {state.contentLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.6)',
                    zIndex: 9,
                  }}
                >
                  <Spin />
                </div>
              )}
            </div>
          );
        }

        // 表格模式
        if (columns) {
          const rowSelection =
            selectionType === 'none'
              ? false
              : {
                  type: selectionType,
                  selectedRowKeys,
                  onChange: (keys: (string | number)[], rows: T[]) => {
                    setSelectedRowKeys(keys);
                    setSelectedRows(rows);
                    onSelectionChange?.(keys, rows);
                  },
                };

          const body = (
            <ProTableN<T>
              ref={tableActionRef}
              columns={columns}
              request={request}
              dataSource={dataSource}
              rowSelection={rowSelection}
              rowKey={rowKey}
              {...tableProps}
            />
          );
          return (
            <div style={{ position: 'relative' }}>
              {body}
              {state.contentLoading && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.6)',
                    zIndex: 9,
                  }}
                >
                  <Spin />
                </div>
              )}
            </div>
          );
        }

        // 普通内容
        const body = children;
        return (
          <div style={{ position: 'relative' }}>
            {body}
            {state.contentLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.6)',
                  zIndex: 9,
                }}
              >
                <Spin />
              </div>
            )}
          </div>
        );
      };

      // 渲染弹窗
      const renderDialog = () => {
        if (mode === 'drawer') {
          return (
            <Drawer
              {...({
                visible,
                title: renderTitle(),
                footer: renderFooter(),
                closable,
                closeIcon,
                mask,
                maskClosable,
                maskStyle,
                style: {
                  ...style,
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                },
                className,
                bodyStyle,
                headerStyle,
                escToExit,
                mountOnEnter,
                unmountOnExit,
                focusLock,
                autoFocus,
                getPopupContainer,
                getChildrenPopupContainer,
                afterOpen,
                afterClose,
                onCancel: handleClose,
                confirmLoading: state.confirmLoading,
                width: finalWidth,
                height: finalHeight,
                placement,
                zIndex,
              } as any)}
            >
              {renderContent()}
            </Drawer>
          );
        }

        return (
          <Modal
            {...({
              visible,
              title: renderTitle(),
              footer: renderFooter(),
              closable,
              closeIcon,
              mask,
              maskClosable,
              maskStyle,
              style: {
                ...style,
                maxWidth: '100vw',
                maxHeight: '100vh',
              },
              className,
              wrapStyle,
              wrapClassName,
              escToExit,
              mountOnEnter,
              unmountOnExit,
              focusLock,
              autoFocus,
              getPopupContainer,
              getChildrenPopupContainer,
              afterOpen,
              afterClose,
              onCancel: handleClose,
              confirmLoading: state.confirmLoading,
              width: finalWidth,
              simple,
              alignCenter,
              modalRender: dialogRender as any,
              onOk: handleOk,
            } as any)}
          >
            {bodyStyle ? <div style={bodyStyle}>{renderContent()}</div> : renderContent()}
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
export const ProDialog = ProDialogComponent() as unknown as import('./types').ProDialogComponent;

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

ProDialog.form = (config: any): DialogReturnProps =>
  createDialogHolder({
    ...config,
    schemas: config.schemas,
    formProps: config.formProps,
    onSubmit: config.onSubmit || config.onFinish,
  });

ProDialog.table = (config: any): DialogReturnProps =>
  createDialogHolder({
    ...config,
    columns: config.columns,
    tableProps: config.tableProps,
  });

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

// 导出类型
export type {
  ProDialogProps,
  ProDialogInstance,
  DialogMode,
  DialogSize,
  DrawerPlacement,
  FooterPosition,
  DialogButtonConfig,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  FormDialogProps,
  TableDialogProps,
  DialogState,
  DialogEventType,
  DialogEventListener,
  PopconfirmConfig,
  MessageConfig,
  NotificationConfig,
  MessageReturn,
  NotificationReturn,
  ProMessageStatic,
  ProNotificationStatic,
  ProNotifyStatic,
} from './types';

// 导出 Hook 和工具
export { useProDialog } from './useProDialog';
export { getProDialogInstance, instanceRegistry as dialogInstanceRegistry } from './instanceRegistry';
export type { ProFormSchema } from '../ProFormN/types';
export type { ProColumnType } from '../ProTableN/types';
