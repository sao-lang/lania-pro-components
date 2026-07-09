import React, { useState, useCallback, useRef, useEffect } from 'react';
import { deepMerge } from '@lania-pro-components/utils';
import { createImperativeInstance } from '@lania-pro-components/shared';
import { Modal, Drawer } from '@arco-design/web-react';
import type {
  ProDialogInstance,
  ProDialogProps,
  DialogState,
  UseProDialogOptions,
  UseProDialogReturn,
  OpenDialogParams,
} from './types';
import { instanceRegistry as dialogInstanceRegistry } from './instanceRegistry';
import { useDialogInstance } from './useDialogInstance';

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

  const mergedProps = deepMerge(
    deepMerge(defaultOptions || ({} as Record<string, unknown>), restProps as unknown as Record<string, unknown>),
    dynamicConfig as unknown as Record<string, unknown>,
  ) as unknown as UseProDialogOptions<TValues, T>;

  const {
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
    draggable = false,
    resizable = false,
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
    selectionType = 'checkbox',
    defaultSelectedKeys,
    defaultSelectedRows,
    onSelectionChange,
    onSelect,
    rowKey = 'id',
    buttons,
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

  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(defaultSelectedKeys || []);
  const [selectedRows, setSelectedRows] = useState<T[]>(defaultSelectedRows || []);

  useEffect(() => {
    if (titleProp !== undefined) {
      setState((prev) => ({ ...prev, title: titleProp }));
    }
  }, [titleProp]);

  useEffect(() => {
    if (fullscreenProp !== state.fullscreen) {
      setState((prev) => ({ ...prev, fullscreen: fullscreenProp }));
    }
  }, [fullscreenProp, state.fullscreen]);

  const handleClose = useCallback(() => {
    setVisible(false);
    onVisibleChange?.(false);
    onCancel?.();
    handleReset();
  }, [onVisibleChange, onCancel]);

  const handleReset = useCallback(() => {
    if (destroyOnClose) {
      setTimeout(() => {
        setDynamicConfig({});
        setState({
          visible: false,
          confirmLoading: false,
          confirmDisabled: false,
          title: titleProp || '',
          fullscreen: fullscreenProp,
          contentLoading: false,
        });
        setSelectedRowKeys(defaultSelectedKeys || []);
        setSelectedRows(defaultSelectedRows || []);
      }, 300);
    }
  }, [destroyOnClose, titleProp, fullscreenProp, defaultSelectedKeys, defaultSelectedRows]);

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
    setSelectedRowKeys(defaultSelectedKeys || []);
    setSelectedRows(defaultSelectedRows || []);
  }, [titleProp, fullscreenProp, defaultSelectedKeys, defaultSelectedRows]);

  const {
    dialogInstance,
    handleOk,
    renderFooter,
    computedWidth,
    computedHeight,
    renderContent,
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
    onClose: handleClose,
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
    dynamicData: dynamicConfig.data,
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
    closeDialog: handleClose,
    destroyDialog: handleDestroy,
    isControlled: false,
    onUpdateConfig: (config) => {
      setDynamicConfig(
        (prev) =>
          deepMerge(prev as Record<string, unknown>, config as Record<string, unknown>) as OpenDialogParams<TValues>,
      );
    },
  });

  useEffect(() => {
    onInstanceReady?.(dialogInstance);
  }, [onInstanceReady, dialogInstance]);

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

export function useProDialog<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  T extends Record<string, unknown> = Record<string, unknown>,
>(options: UseProDialogOptions<TValues, T> = {}): UseProDialogReturn<TValues, T> {
  const { name, fullscreen: fullscreenProp, ...dialogProps } = options;

  const dialogRef = useRef<ProDialogInstance<TValues, T> | null>(null);
  const instanceHandleRef = useRef<{ close: () => void } | null>(null);
  const managerRef = useRef<ReturnType<
    typeof createImperativeInstance<{
      options: UseProDialogOptions<TValues, T>;
      dialogProps: ProDialogProps<TValues, T>;
      params?: OpenDialogParams<TValues>;
    }>
  > | null>(null);
  const [visible, setVisible] = useState(false);
  const [fullscreen, setFullscreenState] = useState(fullscreenProp || false);

  const ensureManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createImperativeInstance<{
        options: UseProDialogOptions<TValues, T>;
        dialogProps: ProDialogProps<TValues, T>;
        params?: OpenDialogParams<TValues>;
      }>(({ options: opts, dialogProps: dp, params }) => (
        <InternalDialog<TValues, T>
          defaultOptions={opts}
          {...dp}
          onInstanceReady={(instance) => {
            dialogRef.current = instance;
            instance.open(params);
            setVisible(true);
            if (name) {
              dialogInstanceRegistry.register(name, instance as ProDialogInstance);
            }
          }}
        />
      ));
    }
    return managerRef.current;
  }, [name]);

  const open = useCallback(
    (params?: OpenDialogParams<TValues>) => {
      const manager = ensureManager();
      instanceHandleRef.current = manager.open({ options, dialogProps, params });
    },
    [dialogProps, options, ensureManager],
  );

  const close = useCallback(() => {
    dialogRef.current?.close();
    instanceHandleRef.current?.close();
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    if (dialogRef.current) {
      dialogRef.current.toggle();
      setVisible((v) => !v);
    } else {
      open();
    }
  }, [open]);

  const destroy = useCallback(() => {
    dialogRef.current?.destroy();
    managerRef.current?.closeAll();
    instanceHandleRef.current = null;
    dialogRef.current = null;
    setVisible(false);
    if (name) {
      dialogInstanceRegistry.unregister(name);
    }
  }, [name]);

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
