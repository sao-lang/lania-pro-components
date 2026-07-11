/**
 * ProForm — Schema 驱动的表单组件。
 *
 * 三层架构：
 * - useProForm（状态层）：创建 FormStore / arcoForm / instance / 字段导航
 * - ProFormRenderer（渲染层）：Schema 合并、Grid 布局、按钮组、草稿持久化
 * - ProForm（调度层）：检测 form prop，分发到受控/独立模式
 *
 * 使用方式：
 * ```tsx
 * // 独立使用
 * <ProForm schemas={[...]} ref={formRef} />
 *
 * // 配合 useProForm（避免重复实例）
 * const { instance } = useProForm({ schemas });
 * <ProForm instance={instance} />
 * ```
 */
import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { Form, Button, Grid, Card } from '@arco-design/web-react';
import type { ProFormProps, ProFormInstance, ProFormSchema, FieldStatus } from './types';
import { useProForm, ProFormContext } from './useProForm';
import { FormField } from './components/FormField';
import { RootContextProvider, LayoutContextProvider, createFormState } from './context';
import { useGroupLazyLoad, usePriorityLoad, useVirtualScroll } from '@lania-pro-components/shared';
import { useFieldNavigation } from './hooks/useFieldNavigation';
import { setAsyncBatchConfig, clearAsyncBatch } from '@lania-pro-components/utils';
import { useDraft } from './hooks/useDraft';
import type { DraftData, DraftStorage } from '@lania-pro-components/utils';
import { localStorageStrategy, sessionStorageStrategy } from '@lania-pro-components/utils';
import type { DraftConfig } from './types';
import type { ArcoFormInstance } from './hooks/useArcoForm';
import type { FormStore } from './core/FormStore';
import { createSchemaProcessor } from './utils/SchemaProcessor';

const { Row, Col } = Grid;

// ===== ProFormRenderer Props =====
interface ProFormRendererProps extends ProFormProps {
  formStore: FormStore;
  arcoForm: ArcoFormInstance;
  instance: ProFormInstance;
}

/**
 * ProFormRenderer — 渲染组件。
 *
 * 内部创建 UI 能力（componentRefs / fieldNavigation / virtualScroll / draft 状态），
 * 通过 useEffect 覆写 instance 上的桩方法。
 */
const ProFormRenderer: React.FC<ProFormRendererProps> = (props) => {
  const {
    formStore,
    arcoForm,
    instance,
    // 用户 props
    schemas = [],
    layout = 'vertical',
    labelCol,
    wrapperCol,
    colon = true,
    labelAlign = 'left',
    size = 'default',
    disabled = false,
    readonly = false,
    draft,
    preview,
    initialValues,
    onFinish,
    onFinishFailed,
    onValuesChange,
    onFieldsChange,
    onDraftChange,
    onPreviewChange,
    showButton = true,
    submitText = '确认',
    resetText = '取消',
    submitLoading = false,
    resetLoading = false,
    showSubmitButton = true,
    showResetButton = true,
    onReset,
    buttonPosition = 'right',
    collapsible = false,
    collapsed: collapsedProp,
    defaultCollapsed = true,
    expandText = '展开',
    collapseText = '收起',
    collapsedRows = 1,
    onCollapseChange,
    rows,
    buttons,
    buttonList,
    okButtonProps,
    cancelButtonProps,
    rowProps = {},
    colProps = {},
    columns = 1,
    gutter = 16,
    className,
    style,
    scrollToFirstError,
    validateTrigger,
    labelColProps,
    wrapperColProps,
    cardContainer,
    performance,
    schemaProcessOptions,
    transform,
    lifecycle,
    validateMessages,
    valueFormat,
    dateFormat,
    keyboardNavigation,
    draftStorage,
    onFieldFocus,
    onFieldBlur,
  } = props;

  // ===== 内部 UI 能力（由 Renderer 创建，不来自 useProForm）=====
  const componentRefs = useRef<Record<string, unknown>>({});
  const getRef = useCallback((name: string) => componentRefs.current[name], []);
  const setComponentRef = useCallback((name: string, ref: unknown) => {
    componentRefs.current[name] = ref;
  }, []);

  // 本地 draft / preview 状态
  const [isDraftState, setIsDraftState] = useState(!!draft);
  const [isPreviewState, setIsPreviewState] = useState(!!preview);
  useEffect(() => {
    if (draft !== undefined && draft !== isDraftState) setIsDraftState(draft);
  }, [draft, isDraftState]);
  useEffect(() => {
    if (preview !== undefined && preview !== isPreviewState) setIsPreviewState(preview);
  }, [preview, isPreviewState]);

  const fieldNavigation = useFieldNavigation({
    schemas,
    getRef,
    keyboardNavigation,
    formStore,
    onFocus: onFieldFocus,
    onBlur: onFieldBlur,
  });

  const {
    containerRef: virtualContainerRef,
    state: virtualState,
    scrollToIndex,
  } = useVirtualScroll(schemas, {
    itemHeight: props.performance?.virtualScroll?.itemHeight || 60,
    overscan: props.performance?.virtualScroll?.overscan || 5,
    containerHeight: props.performance?.virtualScroll?.containerHeight,
  });

  const scrollToField = useCallback(
    (name: string) => {
      const enabled = props.performance?.virtualScroll?.enabled && schemas.length > 20;
      if (enabled) {
        const index = schemas.findIndex((s) => {
          const sn = Array.isArray(s.name) ? s.name.join('.') : s.name;
          return String(sn) === name;
        });
        if (index !== -1) {
          scrollToIndex(index);
          return;
        }
      }
      arcoForm.scrollToField(name);
    },
    [arcoForm, props.performance, schemas, scrollToIndex],
  );

  // 覆写 instance 的桩方法
  useEffect(() => {
    instance.focusField = fieldNavigation.focusField;
    instance.focusNextField = fieldNavigation.focusNextField;
    instance.focusPrevField = fieldNavigation.focusPrevField;
    (instance as unknown as Record<string, unknown>).getFocusedField = () => fieldNavigation.focusedField;
    instance.scrollToField = scrollToField;
    instance.getRef = getRef as ProFormInstance['getRef'];

    instance.isDraft = () => isDraftState;
    instance.setDraft = (v: boolean) => {
      setIsDraftState(v);
      onDraftChange?.(v);
    };
    instance.isPreview = () => isPreviewState;
    instance.setPreview = (v: boolean) => {
      setIsPreviewState(v);
      onPreviewChange?.(v);
    };

    instance.getFieldStatus = (name: string) => {
      const field = formStore.getField(name);
      return field?.status || 'edit';
    };
    instance.setFieldStatus = (name: string, status: FieldStatus) => {
      const field = formStore.getField(name);
      if (field) {
        field.setStatus(status);
      }
    };
    instance.getFieldStatusMap = () => {
      const map: Record<string, FieldStatus> = {};
      formStore.getAllFields().forEach((field, name) => {
        map[name] = field.status;
      });
      return map;
    };
    instance.setFieldStatusMap = (statusMap) => {
      Object.entries(statusMap).forEach(([name, status]) => {
        const field = formStore.getField(name);
        if (field) {
          field.setStatus(status);
        }
      });
    };
  }, [
    instance,
    fieldNavigation,
    scrollToField,
    getRef,
    isDraftState,
    isPreviewState,
    onDraftChange,
    onPreviewChange,
    formStore,
  ]);

  const mergedSchemas = useMemo(() => {
    if (!schemaProcessOptions || Object.keys(schemaProcessOptions).length === 0) return schemas;
    return schemas.map((s) => createSchemaProcessor(schemaProcessOptions).processSchema(s, props));
  }, [schemas, schemaProcessOptions, transform, lifecycle, valueFormat, dateFormat, initialValues, keyboardNavigation]);

  // 同步 draft 状态
  useEffect(() => {
    if (draft !== undefined && draft !== isDraftState) {
      setIsDraftState(draft);
      onDraftChange?.(draft);
    }
  }, [draft, isDraftState, setIsDraftState, onDraftChange]);

  // 同步 preview 状态
  useEffect(() => {
    if (preview !== undefined && preview !== isPreviewState) {
      setIsPreviewState(preview);
      onPreviewChange?.(preview);
    }
  }, [preview, isPreviewState, setIsPreviewState, onPreviewChange]);

  // 初始化表单值
  useEffect(() => {
    if (initialValues) {
      const timer = setTimeout(() => {
        formStore?.setValues(initialValues);
        arcoForm?.setFieldsValue(initialValues);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialValues, arcoForm, formStore]);

  // 草稿持久化
  const resolveDraftStorage = (storage: DraftConfig['storage']) => {
    if (!storage || storage === 'localStorage') return localStorageStrategy;
    if (storage === 'sessionStorage') return sessionStorageStrategy;
    return storage as DraftStorage;
  };
  const { discardDraft } = useDraft({
    formKey: draftStorage?.formKey || '',
    formStore,
    enabled: !!(draftStorage?.formKey && (draftStorage?.enabled ?? true)),
    autoSaveDelay: draftStorage?.autoSaveDelay ?? 3000,
    ttl: draftStorage?.ttl,
    storage: draftStorage?.storage ? resolveDraftStorage(draftStorage.storage) : undefined,
    onDraftAvailable: (data: DraftData) => draftStorage?.onDraftAvailable?.(data),
    onDraftRestored: (values: Record<string, unknown>) => {
      if (arcoForm) arcoForm.setFieldsValue(values);
      formStore.setValues(values);
      draftStorage?.onDraftRestored?.(values);
    },
  });

  // 批量更新配置
  useEffect(() => {
    const bc = performance?.batchUpdate;
    if (bc?.enabled) {
      setAsyncBatchConfig({ delay: bc.delay, maxBatchSize: bc.maxBatchSize });
    }
    return () => {
      clearAsyncBatch();
    };
  }, [performance?.batchUpdate]);

  // 折叠状态
  const [innerCollapsed, setInnerCollapsed] = useState<boolean>(defaultCollapsed);
  const isControlledCollapse = typeof collapsedProp !== 'undefined';
  const finalCollapsed = isControlledCollapse ? collapsedProp : innerCollapsed;
  const toggleCollapse = () => {
    const next = !finalCollapsed;
    if (!isControlledCollapse) setInnerCollapsed(next);
    onCollapseChange?.(next);
  };

  const formState = useMemo(
    () => createFormState(isDraftState, readonly, disabled, isPreviewState, submitLoading),
    [isDraftState, readonly, disabled, isPreviewState, submitLoading],
  );

  const rootContextValue = useMemo(
    () => ({
      formState,
      instance,
      arcoForm,
      layout: layout === 'compact' ? 'inline' : layout,
      size,
      onValuesChange,
      onFieldsChange,
      onFinish,
      onFinishFailed,
      validateMessages,
    }),
    [
      formState,
      instance,
      arcoForm,
      layout,
      size,
      onValuesChange,
      onFieldsChange,
      onFinish,
      onFinishFailed,
      validateMessages,
    ],
  );

  const layoutContextValue = useMemo(
    () => ({
      columns,
      gutter,
      labelCol: labelColProps || labelCol,
      wrapperCol: wrapperColProps || wrapperCol,
      rowProps,
      colProps,
      colon,
      labelAlign,
      collapsed: finalCollapsed,
      collapsedRows,
    }),
    [
      columns,
      gutter,
      labelCol,
      wrapperCol,
      labelColProps,
      wrapperColProps,
      rowProps,
      colProps,
      colon,
      labelAlign,
      finalCollapsed,
      collapsedRows,
    ],
  );

  // 性能优化
  const virtualScrollConfig = performance?.virtualScroll;
  const isVirtualScrollEnabled = virtualScrollConfig?.enabled && mergedSchemas.length > 20;
  const lazyLoadConfig = performance?.lazyLoad;
  const isLazyLoadEnabled = lazyLoadConfig?.enabled && mergedSchemas.length > 10;

  const { visibleFields: priorityVisibleFields } = usePriorityLoad(
    mergedSchemas.map((s) => (Array.isArray(s.name) ? s.name[0] : s.name)),
    {
      highPriority: lazyLoadConfig?.highPriorityFields || [],
      mediumPriority: lazyLoadConfig?.mediumPriorityFields || [],
      mediumPriorityDelay: lazyLoadConfig?.groupDelay || 200,
      lowPriorityDelay: (lazyLoadConfig?.groupDelay || 200) * 2,
    },
  );

  const { loadedCount: groupLoadedCount } = useGroupLazyLoad(mergedSchemas.length, {
    groupSize: lazyLoadConfig?.groupSize || 10,
    groupDelay: lazyLoadConfig?.groupDelay || 100,
    enabled: isLazyLoadEnabled && !lazyLoadConfig?.highPriorityFields?.length,
  });

  const visibleSchemas = useMemo(() => {
    if (isVirtualScrollEnabled) return virtualState.visibleItems as ProFormSchema[];
    if (isLazyLoadEnabled) {
      if (lazyLoadConfig?.highPriorityFields?.length) {
        return mergedSchemas.filter((s) => priorityVisibleFields.includes(Array.isArray(s.name) ? s.name[0] : s.name));
      }
      return mergedSchemas.slice(0, groupLoadedCount);
    }
    return mergedSchemas;
  }, [
    mergedSchemas,
    isVirtualScrollEnabled,
    isLazyLoadEnabled,
    virtualState.visibleItems,
    priorityVisibleFields,
    groupLoadedCount,
    lazyLoadConfig?.highPriorityFields?.length,
  ]);

  const handleFinish = async (_values: Record<string, unknown>) => {
    try {
      const storedValues = formStore.getValues();
      await onFinish?.(storedValues);
      if (draftStorage?.formKey) discardDraft();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleReset = () => {
    formStore.reset();
    onReset?.();
  };

  const getButtonSpan = (totalColumns: number): number => {
    switch (totalColumns) {
      case 1:
        return 12;
      case 2:
        return 12;
      case 3:
        return 8;
      case 4:
        return 6;
      default:
        return Math.floor(24 / totalColumns);
    }
  };

  const renderButtonsInline = () => {
    if (!showButton || isPreviewState) return null;
    if (buttons) return buttons;
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent:
            buttonPosition === 'left' ? 'flex-start' : buttonPosition === 'center' ? 'center' : 'flex-end',
          gap: 12,
        }}
      >
        {buttonList && buttonList.length > 0 ? (
          buttonList.map((button, index) => (
            <Button
              key={button.key || index}
              type={button.type}
              status={button.status}
              loading={button.loading}
              disabled={button.disabled}
              htmlType={button.htmlType}
              onClick={() => button.onClick?.(instance.getFieldsValue(), instance)}
              {...button.props}
            >
              {button.text}
            </Button>
          ))
        ) : (
          <>
            {showSubmitButton !== false && (
              <Button type='primary' loading={submitLoading} htmlType='submit' {...okButtonProps}>
                {submitText}
              </Button>
            )}
            {showResetButton !== false && (
              <Button loading={resetLoading} onClick={handleReset} {...cancelButtonProps}>
                {resetText}
              </Button>
            )}
          </>
        )}
        {collapsible && (
          <Button type='text' onClick={toggleCollapse}>
            {finalCollapsed ? expandText : collapseText}
          </Button>
        )}
      </div>
    );
  };

  const renderField = (schema: ProFormSchema, index: number) => {
    const key = Array.isArray(schema.name) ? schema.name[0] : schema.name || index;
    return (
      <FormField
        key={key}
        schema={schema}
        formStore={formStore}
        arcoForm={arcoForm}
        setComponentRef={setComponentRef}
        onFieldChange={schema.onFieldChange}
      />
    );
  };

  const renderFields = () => {
    const useGrid = columns > 1;
    const baseSpan = Math.floor(24 / columns);
    const buttonSpan = getButtonSpan(columns);

    if (useGrid) {
      const filteredSchemas = visibleSchemas.filter((s) => {
        const f = formStore.getField(s.name);
        return !f || f.status !== 'hidden';
      });
      let maxFields = collapsible && finalCollapsed ? columns * collapsedRows - 1 : filteredSchemas.length;
      if (rows !== undefined && !collapsible) maxFields = Math.min(maxFields, rows * columns);
      const schemasToRender = filteredSchemas.slice(0, maxFields);

      if (collapsible && finalCollapsed) {
        const items: React.ReactNode[] = [];
        const fieldCount = Math.min(columns - 1, schemasToRender.length);
        for (let i = 0; i < fieldCount; i++) {
          const s = schemasToRender[i];
          items.push(
            <Col key={Array.isArray(s.name) ? s.name[0] : s.name || i} span={baseSpan} {...colProps}>
              {renderField(s, i)}
            </Col>,
          );
        }
        if (showButton && !isPreviewState)
          items.push(
            <Col key='__proform_buttons__' span={baseSpan} {...colProps}>
              {renderButtonsInline()}
            </Col>,
          );
        for (let i = fieldCount; i < schemasToRender.length; i++) {
          const s = schemasToRender[i];
          items.push(
            <Col key={Array.isArray(s.name) ? s.name[0] : s.name || i} span={baseSpan} {...colProps}>
              {renderField(s, i)}
            </Col>,
          );
        }
        return (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <Row gutter={gutter} {...rowProps}>
              {items}
            </Row>
          </div>
        );
      }

      const items: React.ReactNode[] = [];
      let rowAcc = 0;
      for (let i = 0; i < schemasToRender.length; i++) {
        const s = schemasToRender[i];
        const rawCol = s.col;
        const colSpan = (typeof rawCol === 'function' ? rawCol(formStore.getValues()) : rawCol) ?? baseSpan;
        if (rowAcc + colSpan > 24) rowAcc = 0;
        items.push(
          <Col key={Array.isArray(s.name) ? s.name[0] : s.name || i} span={colSpan} {...colProps}>
            {renderField(s, i)}
          </Col>,
        );
        rowAcc += colSpan;
      }
      if (showButton && !isPreviewState) {
        const usedInRow = rowAcc % 24;
        const remaining = 24 - usedInRow;
        if (remaining >= buttonSpan) {
          const spacer = remaining - buttonSpan;
          if (spacer > 0) items.push(<Col key='__proform_spacer__' span={spacer} {...colProps} />);
          items.push(
            <Col key='__proform_buttons__' span={buttonSpan} {...colProps}>
              {renderButtonsInline()}
            </Col>,
          );
        } else {
          items.push(
            <Col key='__proform_buttons__' span={24} {...colProps}>
              {renderButtonsInline()}
            </Col>,
          );
        }
      }
      return (
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Row gutter={gutter} {...rowProps}>
            {items}
          </Row>
        </div>
      );
    }

    return (
      <>
        {schemas.map((schema, index) => renderField(schema, index))}
        {showButton && !isPreviewState && (
          <Form.Item wrapperCol={{ offset: labelCol?.span || 0 }}>{renderButtonsInline()}</Form.Item>
        )}
      </>
    );
  };

  const finalLayout = layout === 'compact' ? 'inline' : layout;
  const compactStyle = layout === 'compact' ? { gap: 8 } : undefined;
  const formContent = renderFields();

  const FormContent = isVirtualScrollEnabled ? (
    <div ref={virtualContainerRef} style={{ height: virtualScrollConfig?.containerHeight || 400, overflow: 'auto' }}>
      <div style={{ height: virtualState.totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${virtualState.offsetY}px)` }}>{formContent}</div>
      </div>
    </div>
  ) : (
    formContent
  );

  const FormComponent = (
    <Form
      form={arcoForm}
      layout={finalLayout}
      labelCol={labelColProps || labelCol}
      wrapperCol={wrapperColProps || wrapperCol}
      colon={colon}
      labelAlign={labelAlign}
      size={size}
      disabled={disabled}
      initialValues={initialValues}
      onSubmit={handleFinish}
      onSubmitFailed={onFinishFailed}
      onValuesChange={onValuesChange}
      scrollToFirstError={scrollToFirstError}
      validateTrigger={validateTrigger}
      className={className}
      style={{ ...style, ...compactStyle, width: '100%' }}
      onKeyDown={fieldNavigation.handleKeyDown}
    >
      {FormContent}
    </Form>
  );

  return (
    <RootContextProvider value={rootContextValue}>
      <LayoutContextProvider value={layoutContextValue}>
        {cardContainer
          ? (() => {
              const cc = typeof cardContainer === 'object' ? cardContainer : {};
              return (
                <Card
                  title={cc.title}
                  extra={cc.extra}
                  bordered={cc.bordered}
                  style={cc.style}
                  className={cc.className}
                  bodyStyle={cc.bodyStyle}
                >
                  {FormComponent}
                </Card>
              );
            })()
          : FormComponent}
      </LayoutContextProvider>
    </RootContextProvider>
  );
};

/**
 * ProFormControlled — 受控模式。
 *
 * 接收外部 useProForm() 返回的 instance，
 * 从 instance 读取 store / arcoForm 等状态。
 * 内部仅创建 ProFormContext.Provider 供子组件消费。
 */
// eslint-disable-next-line react/display-name
const ProFormControlled = forwardRef<ProFormInstance, ProFormProps>((props, ref) => {
  const instance = props.instance as ProFormInstance;
  const { store, arcoForm } = instance;
  const { instance: _omit, ...rest } = props;
  void _omit;
  const bindingProps = rest as unknown as ProFormProps;

  const Provider = useMemo(() => {
    const P = ({ children }: { children: React.ReactNode }) => (
      <ProFormContext.Provider value={{ instance, bindingProps, store, arcoForm }}>{children}</ProFormContext.Provider>
    );
    return P;
  }, [instance, bindingProps, store, arcoForm]);

  useImperativeHandle(ref, () => instance, [instance]);

  return (
    <Provider>
      <ProFormRenderer {...rest} formStore={store} arcoForm={arcoForm} instance={instance} />
    </Provider>
  );
});

/**
 * ProFormStandalone — 独立模式。
 */
// eslint-disable-next-line react/display-name
const ProFormStandalone = forwardRef<ProFormInstance, ProFormProps>((props, ref) => {
  const fullState = useProForm(props);
  const { store, arcoForm, instance, bindingProps } = fullState;

  const Provider = useMemo(() => {
    const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ProFormContext.Provider value={{ instance, bindingProps, store, arcoForm }}>{children}</ProFormContext.Provider>
    );
    return P;
  }, [instance, bindingProps, store, arcoForm]);

  useImperativeHandle(ref, () => instance, [instance]);

  return (
    <Provider>
      <ProFormRenderer {...(props as ProFormProps)} formStore={store} arcoForm={arcoForm} instance={instance} />
    </Provider>
  );
});

/**
 * ProForm — 调度层。
 *
 * 检测 props.instance 是否存在：
 * - 有 → ProFormControlled（受控模式，复用外部状态）
 * - 无 → ProFormStandalone（独立模式，内部创建状态）
 */
export const ProForm = forwardRef<ProFormInstance, ProFormProps>((props, ref) => {
  if (props.instance) {
    return <ProFormControlled {...props} ref={ref} />;
  }
  return <ProFormStandalone {...props} ref={ref} />;
});

ProForm.displayName = 'ProForm';
