import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Space, Spin } from '@arco-design/web-react';
import type { ConfirmProps } from '@arco-design/web-react/es/Modal/confirm';
import { createPromiseConfirm } from '@lania-pro-components/shared';
import { IconFullscreen, IconFullscreenExit } from '@arco-design/web-react/icon';
import type {
  ProDialogInstance,
  DialogState,
  ProDialogProps,
  DialogButtonContext,
  DialogButtonConfig,
  OpenDialogParams,
  DialogSize,
} from './types';
import { ProForm, ProFormInstance, ProFormSchema } from '../ProForm';
import ProTable from '../ProTable';
import type { ProTableActionType } from '../ProTable';
import { getSizeWidth, getFooterJustify } from './utils';

export interface UseDialogInstanceOptions<TValues, T> {
  state: DialogState;
  setState: React.Dispatch<React.SetStateAction<DialogState>>;
  titleProp?: React.ReactNode;
  fullscreenProp?: boolean;
  defaultSelectedKeys?: (string | number)[];
  defaultSelectedRows?: T[];
  selectedRowKeys: (string | number)[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  selectedRows: T[];
  setSelectedRows: React.Dispatch<React.SetStateAction<T[]>>;

  mode?: 'modal' | 'drawer';
  size?: DialogSize;
  width?: number | string;
  height?: number | string;
  subTitle?: React.ReactNode;
  titleIcon?: React.ReactNode;
  footerStyle?: React.CSSProperties;
  footerPosition?: 'left' | 'center' | 'right';
  showFooter?: boolean;
  footer?: React.ReactNode | null;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okButtonProps?: import('@arco-design/web-react').ButtonProps;
  cancelButtonProps?: import('@arco-design/web-react').ButtonProps;
  hideCancel?: boolean;
  showOk?: boolean;
  showCancel?: boolean;
  extraButtons?: DialogButtonConfig<TValues, T>[];
  buttons?: DialogButtonConfig<TValues, T>[];
  showFullscreen?: boolean;
  afterClose?: () => void;
  onVisibleChange?: (visible: boolean) => void;
  onOk?: ((e?: React.MouseEvent<Element>) => Promise<unknown>) | ((e?: React.MouseEvent<Element>) => void);
  onCancel?: () => void;
  onClose?: () => void;
  confirmOnClose?: boolean;
  confirmTitle?: React.ReactNode;
  confirmContent?: React.ReactNode;
  isEditing?: boolean | (() => boolean);
  draggable?: boolean;
  resizable?: boolean;

  schemas?: ProFormSchema<TValues>[];
  formProps?: import('../ProForm/types').ProFormProps<TValues>;
  initialValues?: Partial<TValues>;
  onFinish?: ((values: TValues) => Promise<void>) | ((values: TValues) => void);
  onSubmit?: (values: TValues) => boolean | void | Promise<boolean | void>;
  beforeSubmit?: (values: TValues) => Promise<boolean> | boolean;
  onValuesChange?: (changedValues: Partial<TValues>, allValues: TValues) => void;
  dynamicData?: Partial<TValues>;

  columns?: import('../ProTable/types').ProColumnType<T>[];
  tableProps?: import('../ProTable/types').ProTableProps<T>;
  request?: import('../ProTable/types').ProTableProps<T>['request'];
  dataSource?: T[];
  selectionType?: 'checkbox' | 'radio' | 'none';
  onSelectionChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
  onSelect?: (selectedKeys: (string | number)[], selectedRows: T[]) => boolean | void | Promise<boolean | void>;
  rowKey?: string | ((record: T) => string | number);
  children?: React.ReactNode;
  bodyStyle?: React.CSSProperties;

  closeDialog: () => void;
  destroyDialog?: () => void;
  isControlled?: boolean;

  onUpdateConfig?: (config: Partial<ProDialogProps<TValues, T>>) => void;
}

export interface UseDialogInstanceReturn<TValues, T> {
  dialogInstance: ProDialogInstance<TValues, T>;
  handleOk: () => Promise<void>;
  handleClose: () => void;
  createButtonContext: () => DialogButtonContext<TValues, T>;
  handleButtonClick: (btnConfig: DialogButtonConfig<TValues, T>) => Promise<void>;
  renderTitle: () => React.ReactNode;
  renderFooter: () => React.ReactNode;
  renderContent: () => React.ReactNode;
  toggleFullscreen: () => void;
  computedWidth: number | string;
  computedHeight: number | string | undefined;
  formRef: React.MutableRefObject<ProFormInstance<TValues> | null>;
  tableActionRef: React.MutableRefObject<ProTableActionType | null>;
  dragOffset: { x: number; y: number };
  resizeSize: { width: number; height: number };
  handleDragStart: (e: React.MouseEvent) => void;
  renderTitleWithDrag: () => React.ReactNode;
  handleResizeStart: (e: React.MouseEvent) => void;
}

export function useDialogInstance<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: UseDialogInstanceOptions<TValues, T>): UseDialogInstanceReturn<TValues, T> {
  const {
    state,
    setState,
    selectedRowKeys,
    setSelectedRowKeys,
    selectedRows,
    setSelectedRows,
    defaultSelectedKeys,
    defaultSelectedRows,
    size = 'medium',
    width,
    height,
    subTitle,
    titleIcon,
    footerStyle,
    footerPosition = 'right',
    showFooter = true,
    footer: footerProp,
    okText = '确认',
    cancelText = '取消',
    okButtonProps,
    cancelButtonProps,
    hideCancel = false,
    showOk = true,
    showCancel = true,
    extraButtons = [],
    buttons,
    showFullscreen = false,
    onVisibleChange,
    onOk,
    onCancel,
    onClose,
    confirmOnClose = false,
    confirmTitle = '确认关闭',
    confirmContent = '确定要关闭弹窗吗？未保存的数据将丢失。',
    isEditing,
    draggable = false,
    resizable = false,
    schemas,
    formProps,
    initialValues,
    onFinish,
    onSubmit,
    beforeSubmit,
    onValuesChange,
    dynamicData,
    columns,
    tableProps,
    request,
    dataSource,
    selectionType = 'checkbox',
    onSelectionChange,
    onSelect,
    rowKey = 'id',
    children,
    closeDialog,
    destroyDialog,
    isControlled = false,
    onUpdateConfig,
  } = options;

  const formRef = useRef<ProFormInstance<TValues>>(null);
  const tableActionRef = useRef<ProTableActionType>(null);
  const [buttonLoadingMap, setButtonLoadingMap] = useState<Record<string, boolean>>({});
  const [dynamicDataState, setDynamicDataState] = useState<Partial<TValues>>(dynamicData || {});

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeSize, setResizeSize] = useState({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number }>({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const minResizeSize = { width: 400, height: 300 };

  const computedWidth = useMemo(() => {
    if (state.fullscreen) {
      return '100%';
    }
    if (width) {
      return width;
    }
    return getSizeWidth(size);
  }, [width, size, state.fullscreen]);

  const computedHeight = useMemo(() => {
    if (state.fullscreen) {
      return '100%';
    }
    return height;
  }, [height, state.fullscreen]);

  const handleClose = useCallback(() => {
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
            closeDialog();
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
    closeDialog();
  }, [
    confirmOnClose,
    isEditing,
    confirmTitle,
    confirmContent,
    isControlled,
    setState,
    onVisibleChange,
    onClose,
    onCancel,
    closeDialog,
  ]);

  const handleOk = useCallback(async () => {
    if (schemas && formRef.current) {
      try {
        setState((prev) => ({ ...prev, confirmLoading: true }));
        const values = await formRef.current.validate();

        if (beforeSubmit) {
          const canSubmit = await beforeSubmit(values);
          if (!canSubmit) {
            setState((prev) => ({ ...prev, confirmLoading: false }));
            return;
          }
        }

        const result = await (onSubmit?.(values) ?? onFinish?.(values));

        if (result === true) {
          handleClose();
        }
      } catch (error) {
        console.error('Form validation error:', error);
      } finally {
        setState((prev) => ({ ...prev, confirmLoading: false }));
        formRef.current?.resetFields();
      }
      return;
    }

    if (columns && onSelect && tableActionRef.current) {
      setState((prev) => ({ ...prev, confirmLoading: true }));
      try {
        const result = await onSelect(selectedRowKeys, selectedRows);
        if (result === true) {
          handleClose();
        }
      } finally {
        setState((prev) => ({ ...prev, confirmLoading: false }));
        tableActionRef.current?.clearSelected();
        setSelectedRowKeys(defaultSelectedKeys ?? []);
        setSelectedRows(defaultSelectedRows ?? []);
      }
      return;
    }

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
    setState,
    setSelectedRowKeys,
    setSelectedRows,
    defaultSelectedKeys,
    defaultSelectedRows,
  ]);

  const toggleFullscreen = useCallback(() => {
    setState((prev) => ({ ...prev, fullscreen: !prev.fullscreen }));
  }, [setState]);

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

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable || state.fullscreen) return;
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;
      const currentWidth =
        typeof computedWidth === 'number' ? computedWidth : (computedWidth ? parseInt(computedWidth, 10) : 600) || 600;
      const currentHeight =
        typeof computedHeight === 'number'
          ? computedHeight
          : (computedHeight ? parseInt(computedHeight, 10) : 400) || 400;
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: currentWidth,
        height: currentHeight,
      };
    },
    [resizable, state.fullscreen, computedWidth, computedHeight],
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

  const createButtonContext = useCallback(
    (): DialogButtonContext<TValues, T> => ({
      dialog: {
        open: () => {},
        close: handleClose,
        toggle: () => {},
        setTitle: (title) => setState((prev) => ({ ...prev, title })),
        setConfirmLoading: (loading) => setState((prev) => ({ ...prev, confirmLoading: loading })),
        setConfirmDisabled: (disabled) => setState((prev) => ({ ...prev, confirmDisabled: disabled })),
        setLoading: (loading) => setState((prev) => ({ ...prev, contentLoading: loading })),
        getFormInstance: () => formRef.current || undefined,
        getTableAction: () => tableActionRef.current || undefined,
        update: () => {},
        destroy: () => {},
        setFormValues: () => {},
        getFormValues: () => ({}) as TValues,
        setFormFieldValue: () => {},
        getFormFieldValue: () => undefined,
        resetForm: () => {},
        validateForm: () => Promise.resolve({} as TValues),
        clearFormValidate: () => {},
        setFormProps: () => {},
        setFormSchemas: () => {},
        submitForm: () => Promise.resolve(),
        reloadTable: () => {},
        reloadAndRestTable: () => {},
        resetTable: () => {},
        clearTableSelection: () => {},
        setTableSelectedRows: () => {},
        setTableSelectedRowKeys: () => {},
        getTableSelectedRows: () => [] as T[],
        getTableSelectedRowKeys: () => [],
        getTablePagination: () => ({ current: 1, pageSize: 20, total: 0 }),
        setTablePagination: () => {},
        getTableParams: () => ({}),
        setTableParams: () => {},
      },
      form: formRef.current || undefined,
      table: tableActionRef.current || undefined,
      open: () => {},
      close: handleClose,
      setTitle: (title) => setState((prev) => ({ ...prev, title })),
      setConfirmLoading: (loading) => setState((prev) => ({ ...prev, confirmLoading: loading })),
      setConfirmDisabled: (disabled) => setState((prev) => ({ ...prev, confirmDisabled: disabled })),
      setLoading: (loading) => setState((prev) => ({ ...prev, contentLoading: loading })),
      confirm: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) =>
        createPromiseConfirm(config as Parameters<typeof createPromiseConfirm>[0]),
      info: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.info(config as ConfirmProps),
      success: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.success(config as ConfirmProps),
      warning: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.warning(config as ConfirmProps),
      error: (config: Omit<import('./types').ConfirmDialogConfig, 'type'>) => Modal.error(config as ConfirmProps),
    }),
    [handleClose, setState],
  );

  useEffect(() => {
    if (!draggable) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [draggable, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (!resizable) return;
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizable, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    if (!state.visible || state.fullscreen) {
      setDragOffset({ x: 0, y: 0 });
      setResizeSize({ width: 0, height: 0 });
    }
  }, [state.visible, state.fullscreen]);

  const handleButtonClick = useCallback(
    async (btnConfig: DialogButtonConfig<TValues, T>) => {
      const context = createButtonContext();

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
    [createButtonContext, handleClose],
  );

  const renderTitle = useCallback(() => {
    if (!state.title && !subTitle && !titleIcon) {
      return null;
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {titleIcon && <span>{titleIcon}</span>}
        <div>
          <div>{state.title}</div>
          {subTitle && (
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 'normal' }}>{subTitle}</div>
          )}
        </div>
      </div>
    );
  }, [state.title, subTitle, titleIcon]);

  const renderTitleWithDrag = useCallback(() => {
    const title = renderTitle();
    if (!title || !draggable || state.fullscreen) {
      return title;
    }
    return (
      <div
        style={{
          cursor: 'move',
          userSelect: 'none',
        }}
        onMouseDown={handleDragStart}
      >
        {title}
      </div>
    );
  }, [renderTitle, draggable, state.fullscreen, handleDragStart]);

  const renderFooter = useCallback(() => {
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
      extraButtons.forEach((btn) => {
        const btnContext = createButtonContext();
        const disabledVal = typeof btn.disabled === 'function' ? btn.disabled(btnContext) : !!btn.disabled;
        buttonList.push(
          <Button
            key={btn.key}
            type={btn.type}
            status={btn.status}
            loading={btn.loading}
            disabled={disabledVal}
            onClick={() => btn.onClick?.(btnContext)}
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
      <div style={{ display: 'flex', justifyContent: getFooterJustify(footerPosition), gap: 8, ...footerStyle }}>
        <Space>{buttonList}</Space>
      </div>
    );
  }, [
    footerProp,
    showFooter,
    buttons,
    extraButtons,
    showFullscreen,
    showCancel,
    hideCancel,
    showOk,
    okText,
    cancelText,
    okButtonProps,
    cancelButtonProps,
    footerPosition,
    footerStyle,
    state.fullscreen,
    state.confirmLoading,
    state.confirmDisabled,
    buttonLoadingMap,
    createButtonContext,
    handleButtonClick,
    handleClose,
    handleOk,
    toggleFullscreen,
  ]);

  const computedInitialValues = useMemo(
    () => ({
      ...(initialValues as Partial<TValues>),
      ...dynamicDataState,
    }),
    [initialValues, dynamicDataState],
  );

  const renderContent = useCallback(() => {
    if (schemas) {
      const body = (
        <ProForm
          ref={formRef as React.Ref<ProFormInstance<Record<string, unknown>>>}
          {...(formProps as import('../ProForm/types').ProFormProps<Record<string, unknown>>)}
          schemas={schemas as import('../ProForm/types').ProFormSchema<Record<string, unknown>>[]}
          initialValues={computedInitialValues}
          onValuesChange={
            onValuesChange as (
              changedValues: Partial<Record<string, unknown>>,
              allValues: Record<string, unknown>,
            ) => void
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
  }, [
    schemas,
    formProps,
    initialValues,
    computedInitialValues,
    onValuesChange,
    columns,
    selectionType,
    selectedRowKeys,
    selectedRows,
    onSelectionChange,
    request,
    dataSource,
    rowKey,
    tableProps,
    children,
    state.contentLoading,
    setSelectedRowKeys,
    setSelectedRows,
  ]);

  const dialogInstance: ProDialogInstance<TValues, T> = useMemo(
    () => ({
      open: (params?: OpenDialogParams<TValues>) => {
        if (!isControlled) {
          setState((prev) => ({ ...prev, visible: true }));
        }
        if (params?.title !== undefined) {
          setState((prev) => ({ ...prev, title: params.title }));
        }
        if (params?.data !== undefined) {
          setDynamicDataState(params.data);
        }
        onVisibleChange?.(true);
      },
      close: handleClose,
      toggle: () => {
        if (state.visible) {
          handleClose();
        } else {
          if (!isControlled) {
            setState((prev) => ({ ...prev, visible: true }));
          }
          onVisibleChange?.(true);
        }
      },
      setTitle: (title) => setState((prev) => ({ ...prev, title })),
      setConfirmLoading: (loading) => setState((prev) => ({ ...prev, confirmLoading: loading })),
      setConfirmDisabled: (disabled) => setState((prev) => ({ ...prev, confirmDisabled: disabled })),
      setLoading: (loading) => setState((prev) => ({ ...prev, contentLoading: loading })),
      getFormInstance: (): ProFormInstance<TValues> | undefined => formRef.current ?? undefined,
      getTableAction: (): ProTableActionType | undefined => tableActionRef.current ?? undefined,
      update: (config) => {
        onUpdateConfig?.(config);
        const stateUpdates: Partial<DialogState> = {};
        if (config.title !== undefined) {
          stateUpdates.title = config.title;
        }
        if (config.fullscreen !== undefined) {
          stateUpdates.fullscreen = !!config.fullscreen;
        }
        if (config.confirmLoading !== undefined) {
          stateUpdates.confirmLoading = config.confirmLoading;
        }
        if (config.confirmDisabled !== undefined) {
          stateUpdates.confirmDisabled = config.confirmDisabled;
        }
        if (config.contentLoading !== undefined) {
          stateUpdates.contentLoading = config.contentLoading;
        }
        if (Object.keys(stateUpdates).length > 0) {
          setState((prev) => ({ ...prev, ...stateUpdates }));
        }
        if (config.data !== undefined) {
          setDynamicDataState(config.data);
        }
      },
      destroy: () => {
        if (!isControlled) {
          setState((prev) => ({ ...prev, visible: false }));
        }
        onVisibleChange?.(false);
        onClose?.();
        onCancel?.();
        closeDialog();
        destroyDialog?.();
      },

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
        const keys = rows.map((row) =>
          typeof rowKey === 'function' ? rowKey(row) : (row[rowKey as keyof T] as string | number),
        );
        tableActionRef.current?.setSelectedRows(keys, rows);
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
    }),
    [
      state.visible,
      isControlled,
      setState,
      onVisibleChange,
      onClose,
      onCancel,
      closeDialog,
      destroyDialog,
      handleClose,
    ],
  );

  return {
    dialogInstance,
    handleOk,
    handleClose,
    createButtonContext,
    handleButtonClick,
    renderTitle,
    renderFooter,
    renderContent,
    toggleFullscreen,
    computedWidth,
    computedHeight,
    formRef,
    tableActionRef,
    dragOffset,
    resizeSize,
    handleDragStart,
    renderTitleWithDrag,
    handleResizeStart,
  };
}
