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
import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect, useMemo } from 'react';
import { Modal, Drawer, Button, Space, Spin } from '@arco-design/web-react';
import type { ConfirmProps } from '@arco-design/web-react/es/Modal/confirm';
import { createPromiseConfirm } from '@lania-pro-components/shared';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import type {
  ProDialogProps,
  ProDialogInstance,
  DialogState,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  OpenDialogParams,
  FormDialogProps,
  TableDialogProps,
  DialogButtonContext,
  DialogButtonConfig,
  ProDialogComponent,
} from './types';
import { ProForm, ProFormInstance, ProFormSchema, ProFormProps } from '../ProForm';
import { ProTable, ProTableActionType } from '../ProTable';
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
      // 状态管理
      const [state, setState] = useState<DialogState>({
        visible: defaultVisible,
        confirmLoading: confirmLoadingProp,
        confirmDisabled: false,
        title: titleProp || '',
        fullscreen: fullscreenProp,
        contentLoading: false,
      });

      // 拖拽状态
      const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
      const isDraggingRef = useRef(false);
      const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

      // 调整大小状态
      const [resizeSize, setResizeSize] = useState({ width: 0, height: 0 });
      const isResizingRef = useRef(false);
      const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
      const minResizeSize = { width: 300, height: 200 };

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
        getFormInstance: (): ProFormInstance<TValues> | undefined => formRef.current ?? undefined,
        getTableAction: (): ProTableActionType | undefined => tableActionRef.current ?? undefined,
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
        getFormValues: (nameList): TValues => {
          const value = formRef.current?.getFieldsValue(nameList);
          return (value || {}) as TValues;
        },
        setFormFieldValue: (name, value) => {
          formRef.current?.setFieldValue(name, value);
        },
        getFormFieldValue: (name) => formRef.current?.getFieldValue(name),
        resetForm: (nameList) => {
          formRef.current?.resetFields(nameList);
        },
        validateForm: (): Promise<TValues> => {
          const promise = formRef.current?.validate();
          return (promise || Promise.resolve({} as TValues)) as Promise<TValues>;
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
        submitForm: (): Promise<void> => (formRef.current?.submit() as unknown as Promise<void>) || Promise.resolve(),

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
        getTableSelectedRows: (): T[] => (tableActionRef.current?.getSelectedRows() as T[]) || ([] as T[]),
        getTableSelectedRowKeys: (): (string | number)[] => tableActionRef.current?.getSelectedRowKeys() || [],
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

      useEffect(() => {
        dialogInstanceRef.current = dialogInstance;
        if (typeof dialogRef === 'function') {
          dialogRef(dialogInstance);
        } else if (dialogRef) {
          dialogRef.current = dialogInstance;
        }
      }, [dialogInstance, dialogRef]);

      // 注册实例
      useEffect(() => {
        if (instance && dialogInstanceRef.current) {
          instanceRegistry.register(instance, dialogInstanceRef.current as ProDialogInstance);
          return () => {
            instanceRegistry.unregister(instance);
          };
        }
      }, [instance]);

      // 关闭或全屏时重置拖拽偏移
      useEffect(() => {
        if (!visible || state.fullscreen) {
          setDragOffset({ x: 0, y: 0 });
        }
      }, [visible, state.fullscreen]);

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
                onClose?.();
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
        onClose?.();
        onCancel?.();
      }, [confirmOnClose, isEditing, confirmTitle, confirmContent, isControlled, onVisibleChange, onClose, onCancel]);

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

      // 拖拽事件处理
      const handleDragStart = useCallback(
        (e: React.MouseEvent) => {
          if (!draggable || state.fullscreen) return;
          isDraggingRef.current = true;
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offsetX: dragOffset.x,
            offsetY: dragOffset.y,
          };
        },
        [draggable, state.fullscreen, dragOffset.x, dragOffset.y],
      );

      const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setDragOffset({
          x: dragStartRef.current.offsetX + dx,
          y: dragStartRef.current.offsetY + dy,
        });
      }, []);

      const handleDragEnd = useCallback(() => {
        isDraggingRef.current = false;
      }, []);

      useEffect(() => {
        if (!draggable) return;
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        return () => {
          window.removeEventListener('mousemove', handleDragMove);
          window.removeEventListener('mouseup', handleDragEnd);
        };
      }, [draggable, handleDragMove, handleDragEnd]);

      // 调整大小事件处理
      const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
          if (!resizable || state.fullscreen) return;
          e.preventDefault();
          e.stopPropagation();
          isResizingRef.current = true;
          const currentWidth =
            typeof finalWidth === 'number' ? finalWidth : (finalWidth ? parseInt(finalWidth, 10) : 600) || 600;
          const currentHeight =
            typeof finalHeight === 'number' ? finalHeight : (finalHeight ? parseInt(finalHeight, 10) : 400) || 400;
          resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: currentWidth,
            height: currentHeight,
          };
        },
        [resizable, state.fullscreen, finalWidth, finalHeight],
      );

      const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizingRef.current) return;
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        const newWidth = Math.max(minResizeSize.width, resizeStartRef.current.width + dx);
        const newHeight = Math.max(minResizeSize.height, resizeStartRef.current.height + dy);
        setResizeSize({ width: newWidth, height: newHeight });
      }, []);

      const handleResizeEnd = useCallback(() => {
        isResizingRef.current = false;
      }, []);

      useEffect(() => {
        if (!resizable) return;
        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
        return () => {
          window.removeEventListener('mousemove', handleResizeMove);
          window.removeEventListener('mouseup', handleResizeEnd);
        };
      }, [resizable, handleResizeMove, handleResizeEnd]);

      // 关闭或全屏时重置调整大小
      useEffect(() => {
        if (!visible || state.fullscreen) {
          setResizeSize({ width: 0, height: 0 });
        }
      }, [visible, state.fullscreen]);

      // 渲染标题
      const renderTitle = () => {
        if (!state.title && !subTitle && !titleIcon) {
          return null;
        }

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: draggable && !state.fullscreen ? 'move' : undefined,
              userSelect: draggable && !state.fullscreen ? 'none' : undefined,
            }}
            onMouseDown={handleDragStart}
          >
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

      const [buttonLoadingMap, setButtonLoadingMap] = useState<Record<string, boolean>>({});

      const handleButtonClick = useCallback(
        async (btnConfig: DialogButtonConfig<TValues, T>) => {
          const context = {
            dialog: dialogInstance,
            form: formRef.current,
            table: tableActionRef.current,
            open: (params?: OpenDialogParams<TValues>) => dialogInstance.open(params),
            close: () => dialogInstance.close(),
            setTitle: (title: React.ReactNode) => dialogInstance.setTitle(title),
            setConfirmLoading: (loading: boolean) => dialogInstance.setConfirmLoading(loading),
            setConfirmDisabled: (disabled: boolean) => dialogInstance.setConfirmDisabled(disabled),
            setLoading: (loading: boolean) => dialogInstance.setLoading(loading),
            confirm: (config: Omit<ConfirmDialogConfig, 'type'>) =>
              createPromiseConfirm(config as Parameters<typeof createPromiseConfirm>[0]),
            info: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.info(config as ConfirmProps),
            success: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.success(config as ConfirmProps),
            warning: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.warning(config as ConfirmProps),
            error: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.error(config as ConfirmProps),
          } as DialogButtonContext<TValues, T>;

          setButtonLoadingMap((prev) => ({ ...prev, [btnConfig.key]: true }));

          try {
            const result = await btnConfig.onClick?.(context);
            if (result === true) {
              handleClose();
            }
          } finally {
            setButtonLoadingMap((prev) => ({ ...prev, [btnConfig.key]: false }));
          }
        },
        [dialogInstance, handleClose],
      );

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

        const buttonList: React.ReactNode[] = [];

        if (buttons && buttons.length > 0) {
          const context = {
            dialog: dialogInstance,
            form: formRef.current,
            table: tableActionRef.current,
            open: (params?: OpenDialogParams<TValues>) => dialogInstance.open(params),
            close: () => dialogInstance.close(),
            setTitle: (title: React.ReactNode) => dialogInstance.setTitle(title),
            setConfirmLoading: (loading: boolean) => dialogInstance.setConfirmLoading(loading),
            setConfirmDisabled: (disabled: boolean) => dialogInstance.setConfirmDisabled(disabled),
            setLoading: (loading: boolean) => dialogInstance.setLoading(loading),
            confirm: (config: Omit<ConfirmDialogConfig, 'type'>) =>
              createPromiseConfirm(config as Parameters<typeof createPromiseConfirm>[0]),
            info: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.info(config as ConfirmProps),
            success: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.success(config as ConfirmProps),
            warning: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.warning(config as ConfirmProps),
            error: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.error(config as ConfirmProps),
          } as DialogButtonContext<TValues, T>;

          buttons.forEach((btn) => {
            const isVisible = typeof btn.visible === 'function' ? btn.visible(context) : btn.visible !== false;

            if (!isVisible) {
              return;
            }

            const isDisabled = typeof btn.disabled === 'function' ? btn.disabled(context) : !!btn.disabled;

            buttonList.push(
              <Button
                key={btn.key}
                type={btn.type}
                status={btn.status}
                loading={btn.loading || buttonLoadingMap[btn.key]}
                disabled={isDisabled}
                onClick={() => handleButtonClick(btn)}
                {...btn.props}
              >
                {btn.text}
              </Button>,
            );
          });
        } else {
          extraButtons.forEach((btn) => {
            const context = {
              dialog: dialogInstance,
              form: formRef.current,
              table: tableActionRef.current,
              open: (params?: OpenDialogParams<TValues>) => dialogInstance.open(params),
              close: () => dialogInstance.close(),
              setTitle: (title: React.ReactNode) => dialogInstance.setTitle(title),
              setConfirmLoading: (loading: boolean) => dialogInstance.setConfirmLoading(loading),
              setConfirmDisabled: (disabled: boolean) => dialogInstance.setConfirmDisabled(disabled),
              setLoading: (loading: boolean) => dialogInstance.setLoading(loading),
              confirm: (config: Omit<ConfirmDialogConfig, 'type'>) =>
                new Promise<boolean>((resolve) => {
                  Modal.confirm({
                    ...config,
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false),
                  } as ConfirmProps);
                }),
              info: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.info(config as ConfirmProps),
              success: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.success(config as ConfirmProps),
              warning: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.warning(config as ConfirmProps),
              error: (config: Omit<ConfirmDialogConfig, 'type'>) => Modal.error(config as ConfirmProps),
            } as DialogButtonContext<TValues, T>;
            const disabledVal =
              typeof btn.disabled === 'function' ? btn.disabled(context as DialogButtonContext) : !!btn.disabled;
            buttonList.push(
              <Button
                key={btn.key}
                type={btn.type}
                status={btn.status}
                loading={btn.loading}
                disabled={disabledVal}
                onClick={() => btn.onClick?.(context as DialogButtonContext)}
                {...btn.props}
              >
                {btn.text}
              </Button>,
            );
          });

          if (showFullscreen) {
            buttonList.push(
              <Button
                key='fullscreen'
                type='text'
                icon={state.fullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
                onClick={toggleFullscreen}
              />,
            );
          }

          if (showCancel && !hideCancel) {
            buttonList.push(
              <Button key='cancel' onClick={handleClose} disabled={state.confirmLoading} {...cancelButtonProps}>
                {cancelText}
              </Button>,
            );
          }

          if (showOk) {
            buttonList.push(
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
            <Space>{buttonList}</Space>
          </div>
        );
      };

      // 渲染内容
      const renderContent = () => {
        // 表单模式
        if (schemas) {
          const body = (
            <ProForm
              ref={formRef as React.RefObject<ProFormInstance<Record<string, unknown>>>}
              {...(formProps as ProFormProps<Record<string, unknown>>)}
              schemas={schemas as ProFormSchema<Record<string, unknown>>[]}
              initialValues={initialValues}
              onValuesChange={
                onValuesChange as
                  | ((changedValues: Partial<Record<string, unknown>>, allValues: Record<string, unknown>) => void)
                  | undefined
              }
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
            <ProTable<T>
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
              visible={visible}
              title={renderTitle()}
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
              width={finalWidth}
              height={finalHeight}
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
            title={renderTitle()}
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
              width: resizeSize.width > 0 ? resizeSize.width : finalWidth,
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

ProDialog.form = (<TValues extends Record<string, unknown>>(
  config: Omit<OpenDialogConfig<TValues, unknown>, 'schemas' | 'formProps'> &
    FormDialogProps<TValues> & { title: React.ReactNode },
): DialogReturnProps =>
  createDialogHolder({
    ...config,
    schemas: config.schemas,
    formProps: config.formProps,
    onSubmit: config.onSubmit || config.onFinish,
  })) as ProDialogComponent['form'];

ProDialog.table = (<TRow extends Record<string, unknown>>(
  config: Omit<OpenDialogConfig<unknown, TRow>, 'columns' | 'tableProps'> &
    TableDialogProps<TRow> & { title: React.ReactNode },
): DialogReturnProps =>
  createDialogHolder({
    ...config,
    columns: config.columns,
    tableProps: config.tableProps,
  })) as ProDialogComponent['table'];

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
export type { ProFormSchema } from '../ProForm/types';
export type { ProColumnType } from '../ProTable/types';
