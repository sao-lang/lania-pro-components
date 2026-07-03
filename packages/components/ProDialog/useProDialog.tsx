import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getSizeWidth, getFooterJustify } from './utils';
import { deepMerge } from '@lania-pro-components/utils';
import { createRoot } from 'react-dom/client';
import { createPromiseConfirm } from '@lania-pro-components/shared';
import { Modal, Drawer, Button, Space, Spin } from '@arco-design/web-react';
import type { ConfirmProps } from '@arco-design/web-react/es/Modal/confirm';
import type {
  ProDialogInstance,
  ProDialogProps,
  DialogState,
  UseProDialogOptions,
  UseProDialogReturn,
  DialogButtonContext,
  DialogButtonConfig,
  OpenDialogParams,
} from './types';
import { ProForm, ProFormInstance, ProFormSchema } from '../ProForm';
import { ProTable, ProTableActionType } from '../ProTable';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import { instanceRegistry as dialogInstanceRegistry } from './instanceRegistry';

/**
 * 内部弹窗组件
 */
interface InternalDialogProps<TValues, T> extends ProDialogProps<TValues, T> {
  defaultOptions: UseProDialogOptions<TValues, T>;
  onInstanceReady?: (instance: ProDialogInstance<TValues, T>) => void;
}

const InternalDialog = <TValues extends Record<string, unknown>, T extends Record<string, unknown>>(
  props: InternalDialogProps<TValues, T>,
) => {
  const { defaultOptions, onInstanceReady, ...restProps } = props;

  const [visible, setVisible] = useState(false);
  const [dynamicConfig, setDynamicConfig] = useState<OpenDialogParams<TValues>>({});

  // 合并默认配置、组件属性配置和动态配置
  const mergedProps = deepMerge(
    deepMerge(defaultOptions || ({} as Record<string, unknown>), restProps as unknown as Record<string, unknown>),
    dynamicConfig as unknown as Record<string, unknown>,
  ) as unknown as UseProDialogOptions<TValues, T>;

  const {
    // 基础配置
    mode = 'modal',
    size = 'medium',
    width,
    height,
    placement = 'right',
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
    showOk = true,
    showCancel = true,
    extraButtons = [],
    afterOpen,
    afterClose,
    onVisibleChange,
    onOk,
    onCancel,
    escToExit = true,
    mountOnEnter = true,
    unmountOnExit = false,
    focusLock = true,
    autoFocus = true,
    getPopupContainer,
    getChildrenPopupContainer,
    dialogRender,
    zIndex,
    simple = false,
    alignCenter = true,
    fullscreen: fullscreenProp = false,
    showFullscreen = false,
    confirmOnClose = false,
    confirmTitle = '确认关闭',
    confirmContent = '确定要关闭弹窗吗？未保存的数据将丢失。',
    isEditing,
    // 表单配置
    schemas,
    formProps,
    initialValues,
    onFinish,
    onSubmit,
    beforeSubmit,
    onValuesChange,
    // 表格配置
    columns,
    tableProps,
    request,
    dataSource,
    selectionType = 'checkbox',
    defaultSelectedKeys,
    defaultSelectedRows,
    onSelectionChange,
    onSelect,
    rowKey = 'id',
    // 按钮配置
    buttons,
    // 其他配置
    destroyOnClose = true,
    children,
  } = mergedProps;

  const [state, setState] = useState<DialogState>({
    visible: false,
    confirmLoading: false,
    confirmDisabled: false,
    title: titleProp || '',
    fullscreen: fullscreenProp,
    contentLoading: false,
  });
  const [buttonLoadingMap, setButtonLoadingMap] = useState<Record<string, boolean>>({});

  const formRef = useRef<ProFormInstance<TValues>>(null);
  const tableActionRef = useRef<ProTableActionType>(null);
  const dialogInstanceRef = useRef<ProDialogInstance<TValues, T> | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(defaultSelectedKeys || []);
  const [selectedRows, setSelectedRows] = useState<T[]>(defaultSelectedRows || []);

  // 同步 title
  useEffect(() => {
    if (titleProp !== undefined) {
      setState((prev) => ({ ...prev, title: titleProp }));
    }
  }, [titleProp]);

  // 处理打开弹窗
  const handleOpen = useCallback(
    (params?: OpenDialogParams<TValues>) => {
      // 保存动态配置（如果没有传入，则重置为空对象）
      const config = params || {};
      setDynamicConfig(config);

      // 如果有标题，更新标题；否则恢复为初始标题
      if (config.title) {
        setState((prev) => ({ ...prev, title: config.title }));
      } else if (titleProp !== undefined) {
        setState((prev) => ({ ...prev, title: titleProp }));
      }

      setVisible(true);
    },
    [titleProp],
  );

  // 关闭处理
  const handleClose = useCallback(() => {
    // 确认关闭
    if (confirmOnClose) {
      const editing = typeof isEditing === 'function' ? isEditing() : isEditing;
      if (editing) {
        void createPromiseConfirm({
          title: confirmTitle,
          content: confirmContent,
        }).then((confirmed) => {
          if (confirmed) {
            performClose();
          }
        });
        return;
      }
    }

    performClose();
  }, [confirmOnClose, isEditing, confirmTitle, confirmContent]);

  // 执行关闭
  const performClose = useCallback(() => {
    setVisible(false);
    onVisibleChange?.(false);
    onCancel?.();
    handleReset();
  }, [onVisibleChange, onCancel]);

  // 重置状态 - 关闭后重置为默认值
  const handleReset = useCallback(() => {
    if (destroyOnClose) {
      setTimeout(() => {
        // 重置所有状态为默认值
        setDynamicConfig({});
        setState({
          visible: false,
          confirmLoading: false,
          confirmDisabled: false,
          title: titleProp || '',
          fullscreen: fullscreenProp,
          contentLoading: false,
        });
        setButtonLoadingMap({});
        // 重置表单
        if (formRef.current) {
          formRef.current.resetFields();
        }
        // 清空表格选中
        if (tableActionRef.current) {
          tableActionRef.current.clearSelected();
        }
        setSelectedRowKeys(defaultSelectedKeys || []);
        setSelectedRows(defaultSelectedRows || []);
      }, 300);
    }
  }, [destroyOnClose, titleProp, fullscreenProp, defaultSelectedKeys, defaultSelectedRows]);

  // 销毁处理
  const handleDestroy = useCallback(() => {
    setDynamicConfig({});
    setState({
      visible: false,
      confirmLoading: false,
      confirmDisabled: false,
      title: titleProp || '',
      fullscreen: fullscreenProp,
      contentLoading: false,
    });
    setButtonLoadingMap({});
    formRef.current?.resetFields();
    tableActionRef.current?.clearSelected();
    setSelectedRowKeys(defaultSelectedKeys || []);
    setSelectedRows(defaultSelectedRows || []);
  }, [titleProp, fullscreenProp, defaultSelectedKeys, defaultSelectedRows]);

  // 弹窗实例
  const dialogInstance: ProDialogInstance<TValues, T> = useMemo(
    () => ({
      open: (params) => handleOpen(params),
      close: () => {
        handleClose();
      },
      toggle: () => setVisible((v) => !v),
      setTitle: (title) => setState((prev) => ({ ...prev, title })),
      setConfirmLoading: (loading) => setState((prev) => ({ ...prev, confirmLoading: loading })),
      setConfirmDisabled: (disabled) => setState((prev) => ({ ...prev, confirmDisabled: disabled })),
      setLoading: (loading) => setState((prev) => ({ ...prev, contentLoading: loading })),
      getFormInstance: () => formRef.current || undefined,
      getTableAction: () => tableActionRef.current || undefined,
      update: (config: Partial<ProDialogProps<TValues, T>>) => {
        setDynamicConfig(
          (prev) =>
            deepMerge(prev as Record<string, unknown>, config as Record<string, unknown>) as OpenDialogParams<TValues>,
        );
        if (config.title !== undefined) {
          setState((prev) => ({ ...prev, title: config.title }));
        }
        if (config.fullscreen !== undefined) {
          setState((prev) => ({ ...prev, fullscreen: !!config.fullscreen }));
        }
      },
      destroy: () => {
        setVisible(false);
        handleDestroy();
      },

      setFormValues: (values: Partial<TValues>) => formRef.current?.setFieldsValue(values),
      getFormValues: (nameList?: string[]): TValues =>
        (formRef.current?.getFieldsValue(nameList) as TValues) || ({} as TValues),
      setFormFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) =>
        formRef.current?.setFieldValue(name, value),
      getFormFieldValue: <K extends keyof TValues>(name: K) => formRef.current?.getFieldValue(name),
      resetForm: (nameList?: string[]) => formRef.current?.resetFields(nameList),
      validateForm: (): Promise<TValues> =>
        (formRef.current?.validate() as Promise<TValues>) || Promise.resolve({} as TValues),
      clearFormValidate: (name?: string | string[]) => formRef.current?.clearValidate(name),
      setFormProps: (props: Partial<import('../ProForm/types').ProFormProps<TValues>>) =>
        formRef.current?.setProps(props),
      setFormSchemas: (newSchemas: import('../ProForm/types').ProFormSchema<TValues>[]) =>
        formRef.current?.setSchemas(newSchemas),
      submitForm: (): Promise<void> => (formRef.current?.submit() as unknown as Promise<void>) || Promise.resolve(),

      reloadTable: (resetPageIndex?: boolean) => tableActionRef.current?.reload(resetPageIndex),
      reloadAndRestTable: () => tableActionRef.current?.reloadAndRest(),
      resetTable: () => tableActionRef.current?.reset(),
      clearTableSelection: () => tableActionRef.current?.clearSelected(),
      setTableSelectedRows: (rows: T[]) => tableActionRef.current?.setSelectedRows(rows),
      setTableSelectedRowKeys: (keys: (string | number)[]) => tableActionRef.current?.setSelectedRowKeys(keys),
      getTableSelectedRows: (): T[] => (tableActionRef.current?.getSelectedRows() as T[]) || ([] as T[]),
      getTableSelectedRowKeys: (): (string | number)[] => tableActionRef.current?.getSelectedRowKeys() || [],
      getTablePagination: () =>
        tableActionRef.current?.getPagination() || {
          current: 1,
          pageSize: 20,
          total: 0,
        },
      setTablePagination: (pagination) => tableActionRef.current?.setPagination(pagination),
      getTableParams: () => tableActionRef.current?.getParams() || {},
      setTableParams: (params) => tableActionRef.current?.setParams(params),
    }),
    [handleOpen, handleClose, handleDestroy],
  );

  // 保存实例引用
  useEffect(() => {
    dialogInstanceRef.current = dialogInstance;
  }, [dialogInstance]);

  // 创建按钮上下文
  const createButtonContext = useCallback(
    (): DialogButtonContext<TValues, T> => ({
      dialog: dialogInstanceRef.current as ProDialogInstance<TValues, T>,
      form: formRef.current || undefined,
      table: tableActionRef.current || undefined,
      open: (params) => handleOpen(params),
      close: () => handleClose(),
      setTitle: (title) => setState((prev) => ({ ...prev, title })),
      setConfirmLoading: (loading) => setState((prev) => ({ ...prev, confirmLoading: loading })),
      setConfirmDisabled: (disabled) => setState((prev) => ({ ...prev, confirmDisabled: disabled })),
      setLoading: (loading) => setState((prev) => ({ ...prev, contentLoading: loading })),
      confirm: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) =>
        createPromiseConfirm(config as import('@lania-pro-components/shared').PromiseConfirmOptions),
      info: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.info(config as ConfirmProps),
      success: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.success(config as ConfirmProps),
      warning: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.warning(config as ConfirmProps),
      error: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.error(config as ConfirmProps),
    }),
    [handleOpen, handleClose],
  );

  // 通知实例就绪
  useEffect(() => {
    onInstanceReady?.(dialogInstance);
  }, [onInstanceReady, dialogInstance]);

  // 处理按钮点击
  const handleButtonClick = useCallback(
    async (btnConfig: DialogButtonConfig<TValues, T>) => {
      const context = createButtonContext();

      // 设置按钮 loading
      setButtonLoadingMap((prev) => ({ ...prev, [btnConfig.key]: true }));

      try {
        const result = await btnConfig.onClick?.(context);
        // 返回 true 时自动关闭弹窗
        if (result === true) {
          handleClose();
        }
      } finally {
        setButtonLoadingMap((prev) => ({ ...prev, [btnConfig.key]: false }));
      }
    },
    [createButtonContext, handleClose],
  );

  // 处理确认按钮点击
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

        // 返回 true 时自动关闭弹窗
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
  }, [schemas, columns, onSubmit, onFinish, beforeSubmit, onSelect, selectedRowKeys, selectedRows, onOk, handleClose]);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setState((prev) => ({ ...prev, fullscreen: !prev.fullscreen }));
  }, []);

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

    const buttonList: React.ReactNode[] = [];

    // 如果有自定义按钮组
    if (buttons && buttons.length > 0) {
      const context = createButtonContext();

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
      // 默认按钮组
      // 额外按钮
      extraButtons.forEach((btn) => {
        const btnContext = createButtonContext();
        const disabledVal =
          typeof btn.disabled === 'function' ? btn.disabled(btnContext as DialogButtonContext) : !!btn.disabled;
        buttonList.push(
          <Button
            key={btn.key}
            type={btn.type}
            status={btn.status}
            loading={btn.loading}
            disabled={disabledVal}
            onClick={() => btn.onClick?.(btnContext as DialogButtonContext)}
            {...btn.props}
          >
            {btn.text}
          </Button>,
        );
      });

      // 全屏按钮
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

      // 取消按钮
      if (showCancel && !hideCancel) {
        buttonList.push(
          <Button key='cancel' onClick={handleClose} disabled={state.confirmLoading} {...cancelButtonProps}>
            {cancelText}
          </Button>,
        );
      }

      // 确认按钮
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

  // 计算表单初始值 - 合并默认 initialValues 和动态 data
  const computedInitialValues = useMemo(
    () => ({
      ...(initialValues as Partial<TValues>),
      ...(dynamicConfig.data as Partial<TValues>),
    }),
    [initialValues, dynamicConfig.data],
  );

  // 渲染内容
  const renderContent = () => {
    if (schemas) {
      const body = (
        <ProForm
          ref={formRef as unknown as React.RefObject<ProFormInstance<Record<string, unknown>>>}
          schemas={schemas as unknown as ProFormSchema<Record<string, unknown>>[]}
          initialValues={computedInitialValues}
          onValuesChange={
            onValuesChange as
              | ((changedValues: Partial<Record<string, unknown>>, allValues: Record<string, unknown>) => void)
              | undefined
          }
          showButton={false}
          {...((formProps as Record<string, unknown>) || {})}
          labelCol={formProps?.labelCol || (formProps?.layout === 'horizontal' ? { span: 4 } : undefined)}
          wrapperCol={formProps?.wrapperCol || (formProps?.layout === 'horizontal' ? { span: 20 } : undefined)}
        />
      ) as React.ReactElement;
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

      return (
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
    }

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
        width: finalWidth,
      }}
      className={className}
      wrapStyle={wrapStyle}
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
      alignCenter={alignCenter}
      modalRender={dialogRender}
      onOk={handleOk}
    >
      {bodyStyle ? <div style={bodyStyle}>{renderContent()}</div> : renderContent()}
    </Modal>
  );
};

/**
 * ProDialog Hook - 用于管理弹窗状态
 * @template TValues 表单值类型
 * @template T 表格数据类型
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { open, close, dialog, form, table } = useProDialog({
 *     title: '编辑用户',
 *     schemas: [
 *       { name: 'name', label: '姓名', component: 'Input', required: true },
 *     ],
 *   });
 *
 *   // 打开弹窗并传入表单数据
 *   const handleEdit = (record) => {
 *     open({ title: `编辑: ${record.name}`, data: record });
 *   };
 *
 *   return <Button onClick={() => handleEdit({ name: '张三', age: 25 })}>编辑</Button>;
 * };
 * ```
 */
export function useProDialog<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: UseProDialogOptions<TValues, T> = {}): UseProDialogReturn<TValues, T> {
  const { name, fullscreen: fullscreenProp, ...dialogProps } = options;

  const dialogRef = useRef<ProDialogInstance<TValues, T> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const [visible, setVisible] = useState(false);
  const [fullscreen, setFullscreenState] = useState(fullscreenProp || false);

  // 打开弹窗
  const open = useCallback(
    (params?: OpenDialogParams<TValues>) => {
      if (!containerRef.current) {
        containerRef.current = document.createElement('div');
        document.body.appendChild(containerRef.current);
        rootRef.current = createRoot(containerRef.current);
      }

      rootRef.current?.render(
        <InternalDialog<TValues, T>
          defaultOptions={options}
          {...dialogProps}
          onInstanceReady={(instance) => {
            dialogRef.current = instance;
            instance.open(params);
            setVisible(true);
            if (name) {
              dialogInstanceRegistry.register(name, instance as ProDialogInstance);
            }
          }}
        />,
      );
    },
    [dialogProps, name, options],
  );

  // 关闭弹窗
  const close = useCallback(() => {
    dialogRef.current?.close();
    setVisible(false);
  }, []);

  // 切换弹窗
  const toggle = useCallback(() => {
    if (dialogRef.current) {
      dialogRef.current.toggle();
      setVisible((v) => !v);
    } else {
      open();
    }
  }, [open]);

  // 销毁弹窗
  const destroy = useCallback(() => {
    dialogRef.current?.destroy();
    rootRef.current?.unmount();
    if (containerRef.current?.parentNode) {
      containerRef.current.parentNode.removeChild(containerRef.current);
    }
    containerRef.current = null;
    rootRef.current = null;
    dialogRef.current = null;
    setVisible(false);
    if (name) {
      dialogInstanceRegistry.unregister(name);
    }
  }, [name]);

  // 组件卸载时清理
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

// 导出类型
export type { UseProDialogOptions, UseProDialogReturn, DialogButtonContext, OpenDialogParams };
