import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Form, Button, Grid, Card } from '@arco-design/web-react';
import type { ProFormProps, ProFormInstance, ProFormSchema, SchemaProcessOptions } from './types';
import { useProForm } from './useProForm';
import { FormField } from './FormField';
import { RootContextProvider, LayoutContextProvider, createFormState } from './context';
import { useVirtualScroll } from './hooks/useVirtualScroll';
import { useGroupLazyLoad, usePriorityLoad } from './hooks/useLazyField';
import { FormPerformanceMonitor } from './components/FormPerformanceMonitor';
import { performanceMonitor } from './utils/performance';

import { setAsyncBatchConfig, clearAsyncBatch } from './utils/reactive';

const { Row, Col } = Grid;

/**
 * ProForm 组件
 */
export const ProForm = forwardRef<ProFormInstance<Record<string, unknown>>, ProFormProps<Record<string, unknown>>>(
  (props, ref) => {
    const {
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
      formRef,
      scrollToFirstError,
      validateTrigger,
      labelColProps,
      wrapperColProps,
      cardContainer,
      performance,
      schemaProcessOptions,
      keyboardNavigation,
    } = props;

    const {
      arcoForm,
      instance,
      setComponentRef,
      isDraftState,
      setIsDraftState,
      isPreviewState,
      setIsPreviewState,
      formStore,
      fieldNavigation,
    } = useProForm({
      initialValues,
      onValuesChange,
      onFieldsChange,
      keyboardNavigation,
    });

    const processSchema = useCallback((schema: ProFormSchema, options: SchemaProcessOptions = {}): ProFormSchema => {
      const {
        autoLabel = false,
        autoPlaceholder = false,
        autoAllowClear = false,
        autoRules = false,
        autoDefaultValue = false,
        autoRangePickerName = false,
      } = options;

      const processed: ProFormSchema = { ...schema };

      if (autoLabel && !processed.label) {
        const name = Array.isArray(schema.name) ? schema.name.join('.') : schema.name;
        processed.label = name.replace(/([A-Z])/g, ' $1').trim();
      }

      if (autoPlaceholder && !processed.placeholder) {
        processed.placeholder = processed.label ? `请输入${processed.label}` : '请输入';
      }

      if (autoAllowClear && processed.componentProps) {
        processed.componentProps = { ...processed.componentProps, allowClear: true };
      } else if (autoAllowClear && !processed.componentProps) {
        processed.componentProps = { allowClear: true };
      }

      if (autoRules && !processed.rules && processed.required) {
        processed.rules = [{ required: true, message: `${processed.label || schema.name} 不能为空` }];
      }

      if (autoDefaultValue && processed.initialValue === undefined) {
        const component = processed.component || 'Input';
        if (component === 'Input' || component === 'TextArea') {
          processed.initialValue = '';
        } else if (component === 'Select' || component === 'Cascader') {
          processed.initialValue = undefined;
        } else if (component === 'Checkbox' || component === 'Switch') {
          processed.initialValue = false;
        } else if (component === 'InputNumber') {
          processed.initialValue = undefined;
        } else if (component === 'DatePicker' || component === 'TimePicker') {
          processed.initialValue = undefined;
        }
      }

      if (autoRangePickerName && processed.component?.toLowerCase().includes('rangepicker')) {
        const baseName = Array.isArray(schema.name) ? schema.name[0] : schema.name;
        processed.name = [`${baseName}_start`, `${baseName}_end`];
        (processed as ProFormSchema & { _rangePickerNames?: [string, string] })._rangePickerNames = [
          `${baseName}_start`,
          `${baseName}_end`,
        ];
      }

      return processed;
    }, []);

    const processedSchemas = useMemo(() => {
      if (!schemaProcessOptions || Object.keys(schemaProcessOptions).length === 0) {
        return schemas;
      }
      return schemas.map((schema) => processSchema(schema, schemaProcessOptions));
    }, [schemas, schemaProcessOptions, processSchema]);

    // 暴露实例
    useImperativeHandle(ref, () => instance, [instance]);

    // 同步 formRef
    useEffect(() => {
      if (formRef && typeof formRef === 'function') {
        formRef(instance);
      } else if (formRef && typeof formRef === 'object' && formRef !== null) {
        (formRef as React.MutableRefObject<ProFormInstance<Record<string, unknown>>>).current = instance;
      }
    }, [instance, formRef]);

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
      if (initialValues && arcoForm && formStore) {
        const timer = setTimeout(() => {
          formStore.setValues(initialValues);
          arcoForm.setFieldsValue(initialValues);
        }, 0);
        return () => clearTimeout(timer);
      }
    }, [initialValues, arcoForm, formStore]);

    // 设置批量更新配置
    useEffect(() => {
      const batchUpdateConfig = performance?.batchUpdate;
      if (batchUpdateConfig?.enabled) {
        setAsyncBatchConfig({
          delay: batchUpdateConfig.delay,
          maxBatchSize: batchUpdateConfig.maxBatchSize,
        });
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
      if (!isControlledCollapse) {
        setInnerCollapsed(next);
      }
      onCollapseChange?.(next);
    };

    // 构建表单全局状态
    const formState = useMemo(
      () => createFormState(isDraftState, readonly, disabled, isPreviewState, submitLoading),
      [isDraftState, readonly, disabled, isPreviewState, submitLoading],
    );

    // 构建 RootContext
    const rootContextValue = useMemo(
      () => ({
        formState,
        instance: instance,
        arcoForm,
        layout: layout === 'compact' ? 'inline' : layout,
        size,
        onValuesChange: onValuesChange,
        onFieldsChange: onFieldsChange,
        onFinish: onFinish,
        onFinishFailed: onFinishFailed,
      }),
      [formState, instance, arcoForm, layout, size, onValuesChange, onFieldsChange, onFinish, onFinishFailed],
    );

    // 构建 LayoutContext
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

    // ===== 性能优化：虚拟滚动 =====
    const virtualScrollConfig = performance?.virtualScroll;
    const isVirtualScrollEnabled = virtualScrollConfig?.enabled && processedSchemas.length > 20;

    const { containerRef: virtualContainerRef, virtualState } = useVirtualScroll(processedSchemas, {
      itemHeight: virtualScrollConfig?.itemHeight || 60,
      overscan: virtualScrollConfig?.overscan || 5,
      containerHeight: virtualScrollConfig?.containerHeight,
    });

    // ===== 性能优化：懒加载 =====
    const lazyLoadConfig = performance?.lazyLoad;
    const isLazyLoadEnabled = lazyLoadConfig?.enabled && processedSchemas.length > 10;

    // 优先级加载
    const { visibleFields: priorityVisibleFields } = usePriorityLoad(
      processedSchemas.map((s) => (Array.isArray(s.name) ? s.name[0] : s.name)),
      {
        highPriority: lazyLoadConfig?.highPriorityFields || [],
        mediumPriority: lazyLoadConfig?.mediumPriorityFields || [],
        mediumPriorityDelay: lazyLoadConfig?.groupDelay || 200,
        lowPriorityDelay: (lazyLoadConfig?.groupDelay || 200) * 2,
      },
    );

    // 分组懒加载（当没有配置优先级时使用）
    const { loadedCount: groupLoadedCount } = useGroupLazyLoad(processedSchemas.length, {
      groupSize: lazyLoadConfig?.groupSize || 10,
      groupDelay: lazyLoadConfig?.groupDelay || 100,
      enabled: isLazyLoadEnabled && !lazyLoadConfig?.highPriorityFields?.length,
    });

    // 确定要渲染的 schemas
    const visibleSchemas = useMemo(() => {
      if (isVirtualScrollEnabled) {
        return virtualState.visibleItems as ProFormSchema[];
      }

      if (isLazyLoadEnabled) {
        if (lazyLoadConfig?.highPriorityFields?.length) {
          // 使用优先级加载
          return processedSchemas.filter((s) =>
            priorityVisibleFields.includes(Array.isArray(s.name) ? s.name[0] : s.name),
          );
        } else {
          // 使用分组加载
          return processedSchemas.slice(0, groupLoadedCount);
        }
      }

      return processedSchemas;
    }, [
      processedSchemas,
      isVirtualScrollEnabled,
      isLazyLoadEnabled,
      virtualState.visibleItems,
      priorityVisibleFields,
      groupLoadedCount,
      lazyLoadConfig?.highPriorityFields?.length,
    ]);

    // ===== 性能优化：渲染性能监控 =====
    useEffect(() => {
      if (performance?.monitor?.enabled) {
        performanceMonitor.mark('form-render-start');
        return () => {
          performanceMonitor.measure('form-render', 'form-render-start');
        };
      }
    }, [visibleSchemas, performance?.monitor?.enabled]);

    // 处理表单提交
    const handleFinish = async (values: Record<string, unknown>) => {
      try {
        await onFinish?.(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    };

    // 处理重置
    const handleReset = () => {
      arcoForm.resetFields();
      onReset?.();
    };

    // 计算按钮列宽
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

    // 渲染按钮组
    const renderButtonsInline = () => {
      if (!showButton || isPreviewState) {
        return null;
      }

      if (buttons) {
        return buttons;
      }

      const buttonContent = (
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

      return buttonContent;
    };

    // 渲染单个字段
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

    // 渲染所有字段
    const renderFields = () => {
      const useGrid = columns > 1;
      const baseSpan = Math.floor(24 / columns);
      const buttonSpan = getButtonSpan(columns);

      if (useGrid) {
        // 过滤隐藏字段
        const filteredSchemas = visibleSchemas.filter((schema) => {
          const field = formStore.getField(schema.name);
          return !field || field.status !== 'hidden';
        });

        // 如果是折叠状态，计算可以显示的字段总数（按钮组占1个位置）
        let maxFields = collapsible && finalCollapsed ? columns * collapsedRows - 1 : filteredSchemas.length;

        // 如果设置了 rows，限制显示的行数
        if (rows !== undefined && !collapsible) {
          maxFields = Math.min(maxFields, rows * columns);
        }

        // 限制显示的字段数量
        const schemasToRender = filteredSchemas.slice(0, maxFields);

        // 折叠状态下的特殊布局处理
        if (collapsible && finalCollapsed) {
          const items: React.ReactNode[] = [];

          // 简单直接：第一行前 columns-1 个位置放字段，最后一个位置放按钮组
          const fieldCount = Math.min(columns - 1, schemasToRender.length);

          // 添加前 columns-1 个字段
          for (let i = 0; i < fieldCount; i++) {
            const schema = schemasToRender[i];
            const colKey = Array.isArray(schema.name) ? schema.name[0] : schema.name || i;
            items.push(
              <Col key={colKey} span={baseSpan} {...colProps}>
                {renderField(schema, i)}
              </Col>,
            );
          }

          // 添加按钮组在第一行的最后一列
          if (showButton && !isPreviewState) {
            items.push(
              <Col key='__proform_buttons__' span={baseSpan} {...colProps}>
                {renderButtonsInline()}
              </Col>,
            );
          }

          // 添加剩余的字段
          for (let i = fieldCount; i < schemasToRender.length; i++) {
            const schema = schemasToRender[i];
            const colKey = Array.isArray(schema.name) ? schema.name[0] : schema.name || i;
            items.push(
              <Col key={colKey} span={baseSpan} {...colProps}>
                {renderField(schema, i)}
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

        // 非折叠状态，正常布局
        const items: React.ReactNode[] = [];
        let rowAcc = 0;

        for (let i = 0; i < schemasToRender.length; i++) {
          const schema = schemasToRender[i];
          const colSpan = schema.col || baseSpan;

          // 检查是否需要换行
          if (rowAcc + colSpan > 24) {
            rowAcc = 0;
          }

          const colKey = Array.isArray(schema.name) ? schema.name[0] : schema.name || i;
          items.push(
            <Col key={colKey} span={colSpan} {...colProps}>
              {renderField(schema, i)}
            </Col>,
          );
          rowAcc += colSpan;
        }

        // 添加按钮组
        if (showButton && !isPreviewState) {
          const usedInRow = rowAcc % 24;
          const remaining = 24 - usedInRow;

          if (remaining >= buttonSpan) {
            // 当前行剩余空间足够
            const spacer = remaining - buttonSpan;
            if (spacer > 0) {
              items.push(<Col key='__proform_spacer__' span={spacer} {...colProps} />);
            }
            items.push(
              <Col key='__proform_buttons__' span={buttonSpan} {...colProps}>
                {renderButtonsInline()}
              </Col>,
            );
          } else {
            // 当前行放不下，按钮放新行
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

      // 非 Grid 布局
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

    // 表单内容
    const formContent = renderFields();

    // 虚拟滚动容器包装
    const FormContent = isVirtualScrollEnabled ? (
      <div
        ref={virtualContainerRef}
        style={{
          height: virtualScrollConfig?.containerHeight || 400,
          overflow: 'auto',
        }}
      >
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
                const cardConfig = typeof cardContainer === 'object' ? cardContainer : {};
                return (
                  <Card
                    title={cardConfig.title}
                    extra={cardConfig.extra}
                    bordered={cardConfig.bordered}
                    style={cardConfig.style}
                    className={cardConfig.className}
                    bodyStyle={cardConfig.bodyStyle}
                  >
                    {FormComponent}
                  </Card>
                );
              })()
            : FormComponent}
          {/* 性能监控组件 */}
          {performance?.monitor?.enabled && (
            <FormPerformanceMonitor
              enabled={true}
              position={performance.monitor.position || 'bottom-right'}
              refreshInterval={performance.monitor.refreshInterval || 1000}
            />
          )}
        </LayoutContextProvider>
      </RootContextProvider>
    );
  },
);

ProForm.displayName = 'ProForm';
