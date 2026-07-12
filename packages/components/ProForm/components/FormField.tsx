/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Form } from '@arco-design/web-react';
import type { ProFormSchema, FieldStatus, FieldNodeAPI, ResolvedSchema, ProFormFieldComponentProps } from '../types';
import { getComponent, parseQuickComponent, getReadonlyRenderer, getRendererByMode } from '../registry';
import {
  useRootContext,
  useLayoutContext,
  SchemaContextProvider,
  FieldContextProvider,
  LayoutContextProvider,
  useExtension,
} from '../context';
import type { PermissionExtension, AuditExtension, I18nExtension } from '../context/ExtensionContext';
import { createFieldNode } from '../core/FieldNode';
import type { FormStore } from '../core/FormStore';
import type { ArcoFormInstance } from '../hooks/useArcoForm';

/** 组件 ref 类型：Arco 组件实例或 null */
type ComponentRef = React.RefObject<HTMLElement> | null;

/**
 * FormField 组件的 Props
 * @property schema - 表单项的 JSON schema 定义
 * @property formStore - 表单状态管理核心 store
 * @property arcoForm - Arco Design Form 实例
 * @property setComponentRef - 注册组件 ref 的回调
 * @property onFieldChange - 字段值变化回调
 */
interface FormFieldProps {
  schema: ProFormSchema;
  formStore: FormStore;
  arcoForm: ArcoFormInstance;
  setComponentRef?: (name: string, ref: ComponentRef) => void;
  onFieldChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

/**
 * FormFieldInner（内部渲染组件）的 Props
 * @property fieldNode - 已创建的 FieldNode 实例（含状态订阅能力）
 * @property arcoForm - Arco Design Form 实例
 * @property setComponentRef - 注册组件 ref 的回调
 * @property onFieldChange - 字段值变化回调
 */
interface FormFieldInnerProps {
  fieldNode: FieldNodeAPI;
  arcoForm: ArcoFormInstance;
  setComponentRef?: (name: string, ref: ComponentRef) => void;
  onFieldChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

/**
 * FormFieldInner
 *
 * 表单项的实际渲染组件，负责：
 * 1. 订阅 FieldNode 的状态变化（value / status / resolvedSchema）并驱动 UI 更新
 * 2. 处理用户交互事件（onChange / onFocus / onBlur）并同步回 FieldNode 和 ArcoForm
 * 3. 根据 status 切换编辑态 / 只读态 / 预览态 / 隐藏态
 * 4. 对 RangePicker 等复合组件做特殊处理（双字段映射）
 * 5. 构建 FieldContext 供子组件消费
 */
const FormFieldInner: React.FC<FormFieldInnerProps> = ({ fieldNode, arcoForm, setComponentRef, onFieldChange }) => {
  const rootContext = useRootContext();
  const layoutContext = useLayoutContext();

  // ========== 扩展上下文 ==========
  const permission = useExtension<PermissionExtension>('permission');
  const audit = useExtension<AuditExtension>('audit');
  const i18n = useExtension<I18nExtension>('i18n');

  // ========== 本地状态（由 FieldNode 驱动） ==========
  const [value, setValueState] = useState<unknown>(fieldNode.value);
  const [status, setStatusState] = useState<FieldStatus>(fieldNode.status);
  const [error, setErrorState] = useState<string | undefined>(fieldNode.error);
  const [focused, setFocused] = useState<boolean>(fieldNode.focused || false);
  const [resolvedSchema, setResolvedSchema] = useState<ResolvedSchema>(fieldNode.resolvedSchema);

  const componentRef = useRef<ComponentRef>(null);

  // ========== 焦点管理 ==========
  const handleFocus = useCallback(() => {
    fieldNode.setFocus();
    setFocused(true);
  }, [fieldNode]);

  const handleBlur = useCallback(() => {
    fieldNode.removeFocus();
    setFocused(false);
  }, [fieldNode]);

  // ========== RangePicker 双字段特殊处理 ==========
  // _rangePickerNames 由 ProForm 解析 schema 时注入
  // 若存在，则 RangePicker 的 [start, end] 对应两个独立 field
  const rangePickerNames = (fieldNode.schema as ProFormSchema & { _rangePickerNames?: [string, string] })
    ._rangePickerNames;
  const isRangePickerArray = !!rangePickerNames;

  const fieldName = Array.isArray(fieldNode.name) ? fieldNode.name[0] : fieldNode.name;

  const getComponentValue = useCallback(() => {
    if (isRangePickerArray && rangePickerNames) {
      const [startName, endName] = rangePickerNames;
      const startValue = rootContext.instance.getFieldValue(startName);
      const endValue = rootContext.instance.getFieldValue(endName);
      if (startValue || endValue) {
        return [startValue, endValue];
      }
      return undefined;
    }
    return value;
  }, [isRangePickerArray, rangePickerNames, value, rootContext.instance]);

  // ========== 订阅 FieldNode 状态变更 ==========
  useEffect(() => {
    // 初始化本地状态
    const initialValue = fieldNode.value;
    setValueState(initialValue);
    setStatusState(fieldNode.status);
    setResolvedSchema(fieldNode.resolvedSchema);

    // 订阅 value 变化 → 同步回 ArcoForm + 审计日志
    const unsubscribeValue = fieldNode.subscribeToValueChange((newValue, oldValue) => {
      setValueState(newValue);
      arcoForm.setFieldValue(fieldName, newValue);
      audit?.logFieldChange(fieldName, oldValue, newValue);
    });

    // 订阅 status 变化 + 审计日志
    const unsubscribeStatus = fieldNode.subscribeToStatusChange((newStatus, oldStatus) => {
      setStatusState(newStatus);
      audit?.log('field.status.change', { field: fieldName, oldStatus, newStatus });
    });

    // 订阅 resolvedSchema 变化（label / componentProps / rules 等解析结果）
    const unsubscribeResolved = fieldNode.subscribeToResolvedSchemaChange((resolved) => {
      setResolvedSchema(resolved);
    });

    // 清理订阅
    return () => {
      unsubscribeValue();
      unsubscribeStatus();
      unsubscribeResolved();
    };
  }, [fieldNode, arcoForm, fieldName, audit]);

  // ========== 注册组件 ref 到上层 ==========
  useEffect(() => {
    if (setComponentRef && componentRef.current) {
      setComponentRef(fieldName, componentRef.current);
    }
  }, [fieldName, setComponentRef]);

  // ========== 值变更处理 ==========
  /**
   * 处理组件值变化：
   * 1. 调用 schema 中定义的原始 onChange
   * 2. RangePicker 模式 → 拆分 [startValue, endValue] 分别写入两个 field
   * 3. 普通模式 → 写入单个 field
   * 4. 触发外部 onFieldChange 回调
   */
  const handleChange = useCallback(
    (newValue: unknown, ...rest: unknown[]) => {
      // 调用 schema 中定义的原始 onChange
      const { onChange: originalOnChange } = resolvedSchema.componentProps || {};
      if (typeof originalOnChange === 'function') {
        (originalOnChange as (value: unknown, ...args: unknown[]) => void)(newValue, ...rest);
      }

      // RangePicker 双字段模式
      if (isRangePickerArray && Array.isArray(newValue) && rangePickerNames) {
        const [startName, endName] = rangePickerNames;
        const [startValue, endValue] = newValue as [unknown, unknown];

        fieldNode.setValue(startValue);
        arcoForm.setFieldValue(startName, startValue);
        arcoForm.setFieldValue(endName, endValue);

        onFieldChange?.(newValue, rootContext.instance.getFieldsValue());
        rootContext.onValuesChange?.(
          { [startName]: startValue, [endName]: endValue },
          rootContext.instance.getFieldsValue(),
        );
      } else {
        // 普通单字段模式
        fieldNode.setValue(newValue);
        arcoForm.setFieldValue(fieldName, newValue);

        onFieldChange?.(newValue, rootContext.instance.getFieldsValue());
        rootContext.onValuesChange?.({ [fieldName]: newValue }, rootContext.instance.getFieldsValue());
      }
    },
    [fieldNode, arcoForm, rootContext, onFieldChange, isRangePickerArray, rangePickerNames, fieldName, resolvedSchema],
  );

  // ========== 构建 FieldContext ==========
  /**
   * FieldContext 提供给子组件消费，包含：
   * - 字段元数据（name / label / value / status / error）
   * - 操作方法（setValue / validate / setError / clearError）
   * - 字段节点引用（fieldNode）
   */
  const fieldContextValue = useMemo(
    () => ({
      name: fieldName,
      label: resolvedSchema.label,
      value,
      values: rootContext.instance.getFieldsValue(),
      status,
      focused,
      required: fieldNode.computedRequired,
      formState: rootContext.formState,
      error,
      setValue: (v: unknown) => {
        fieldNode.setValue(v);
        arcoForm.setFieldValue(fieldName, v);
      },
      getFieldValue: (name: string) => arcoForm.getFieldValue(name),
      getFieldsValue: () => arcoForm.getFieldsValue(),
      validate: async () => {
        const err = await fieldNode.validate();
        setErrorState(err);
        arcoForm.setFields({ [fieldName]: { error: err ? { message: err } : undefined } });
      },
      setError: (err?: string) => {
        fieldNode.setError(err);
        setErrorState(err);
        arcoForm.setFields({ [fieldName]: { error: err ? { message: err } : undefined } });
      },
      clearError: () => {
        fieldNode.setError(undefined);
        setErrorState(undefined);
        arcoForm.setFields({ [fieldName]: { error: undefined } });
      },
      fieldNode,
    }),
    [fieldNode, value, status, focused, error, rootContext, arcoForm, fieldName, resolvedSchema.label],
  );

  if (status === 'hidden') {
    return null;
  }

  // ========== 权限扩展检查 ==========
  // checkVisible 返回 false → 不渲染
  if (permission && !permission.checkVisible(fieldName)) {
    return null;
  }
  // checkEditable 返回 false 且当前为编辑态 → 降级为只读
  const effectiveStatus: FieldStatus =
    permission && status === 'edit' && !permission.checkEditable(fieldName) ? 'readonly' : status;

  // ========== 国际化扩展 ==========
  // 对 label / tooltip / extra 等文案应用 i18n.t() 转换
  // 只有 string 类型的文案才做 i18n 转换；ReactNode（如 JSX）直接使用
  const displayLabel =
    i18n && typeof resolvedSchema.label === 'string' ? i18n.t(resolvedSchema.label) : resolvedSchema.label;
  const displayTooltip =
    i18n && typeof resolvedSchema.tooltip === 'string' ? i18n.t(resolvedSchema.tooltip) : resolvedSchema.tooltip;
  const displayExtra =
    i18n && typeof resolvedSchema.extra === 'string' ? i18n.t(resolvedSchema.extra) : resolvedSchema.extra;

  const parsedQuickComponent = parseQuickComponent(resolvedSchema.component);

  const displayValue = useMemo(() => {
    if (isRangePickerArray && rangePickerNames) {
      const [startName, endName] = rangePickerNames;
      const startValue = rootContext.instance.getFieldValue(startName);
      const endValue = rootContext.instance.getFieldValue(endName);
      if (startValue || endValue) {
        return [startValue, endValue];
      }
      return undefined;
    }
    return rootContext.instance.getFieldValue(fieldName);
  }, [isRangePickerArray, rangePickerNames, fieldName, rootContext.instance]);

  // ========== 只读/预览态渲染 ==========
  /**
   * 构建只读模式下的渲染内容：
   * 1. 优先使用 readonlyComponent 指定的组件名称查找渲染器
   * 2. 否则根据 readonlyMode 使用 getRendererByMode 查找（如 'phone'/'email'/'currency' 等）
   * 3. 若 mode 为 'custom'，使用 getReadonlyRenderer 按组件类型查找
   * 4. 兜底使用 textRenderer
   */
  const renderReadonlyContent = useMemo(() => {
    const readonlyComponentName =
      resolvedSchema.readonlyComponent ||
      (parsedQuickComponent.type === 'normal' ? parsedQuickComponent.name : resolvedSchema.component);

    const readonlyConfig = {
      mode: resolvedSchema.readonlyMode,
      format: resolvedSchema.format,
      emptyText: '--',
      prefix: parsedQuickComponent.type === 'prefix' ? parsedQuickComponent.prefix : resolvedSchema.prefix,
      suffix: parsedQuickComponent.type === 'unit' ? parsedQuickComponent.suffix : resolvedSchema.suffix,
      ...resolvedSchema.readonlyConfig,
    };

    const renderer =
      readonlyConfig.mode && readonlyConfig.mode !== 'custom'
        ? getRendererByMode(readonlyConfig.mode)
        : getReadonlyRenderer(readonlyComponentName || 'Input');

    return (
      <>
        {renderer(displayValue, resolvedSchema.options, readonlyConfig, resolvedSchema.componentProps, {
          status,
          values: rootContext.instance.getFieldsValue(),
        })}
      </>
    );
  }, [resolvedSchema, parsedQuickComponent, displayValue]);

  // ========== 编辑态组件渲染 ==========
  /**
   * 根据 status 渲染不同 UI：
   * - preview / readonly → 只读渲染器
   * - edit（默认）→ 实际表单组件
   * - hidden → 不渲染（已在外部处理）
   *
   * 组件查找优先级：
   * 1. QuickComponent 解析（unit / prefix / quick 类型）
   * 2. 直接按组件名称查找
   */
  const renderComponent = () => {
    if (effectiveStatus === 'readonly') {
      return renderReadonlyContent;
    }

    let ComponentToRender: React.ComponentType<ProFormFieldComponentProps> | undefined;
    const additionalProps: Record<string, unknown> = {};

    // 快速组件的 formatter/parser（仅 type === 'quick' 时有效）
    let quickFormatter: ((value: unknown) => unknown) | undefined;
    let quickParser: ((value: unknown) => unknown) | undefined;

    if (parsedQuickComponent.type === 'unit') {
      ComponentToRender =
        parsedQuickComponent.baseComponent === 'InputNumber'
          ? getComponent('QuickInputNumberWithSuffix')
          : getComponent('QuickInputWithSuffix');
      additionalProps.suffix = parsedQuickComponent.suffix;
    } else if (parsedQuickComponent.type === 'prefix') {
      ComponentToRender =
        parsedQuickComponent.baseComponent === 'InputNumber'
          ? getComponent('QuickInputNumberWithSuffix')
          : getComponent('QuickInputWithSuffix');
      additionalProps.prefix = parsedQuickComponent.prefix;
    } else if (parsedQuickComponent.type === 'quick') {
      const { config } = parsedQuickComponent;

      // 如果 config 声明了 prefix/suffix，复用 unit/prefix 的渲染逻辑
      if (config.suffix) {
        ComponentToRender = getComponent(
          config.baseComponent === 'InputNumber' ? 'QuickInputNumberWithSuffix' : 'QuickInputWithSuffix',
        );
        additionalProps.suffix = config.suffix;
      } else if (config.prefix) {
        ComponentToRender = getComponent(
          config.baseComponent === 'InputNumber' ? 'QuickInputNumberWithSuffix' : 'QuickInputWithSuffix',
        );
        additionalProps.prefix = config.prefix;
      } else {
        ComponentToRender = getComponent(parsedQuickComponent.name);
      }

      quickFormatter = config.formatter;
      quickParser = config.parser;
    } else {
      ComponentToRender = getComponent(resolvedSchema.component);
    }

    if (!ComponentToRender) {
      console.warn(`Component "${resolvedSchema.component}" not found`);
      return null;
    }

    const { style: userStyle, ...restComponentProps } = resolvedSchema.componentProps || {};

    // 应用 formatter（存储值 → 展示值）
    const rawValue = getComponentValue();
    const componentValue = quickFormatter ? quickFormatter(rawValue) : rawValue;

    // 应用 parser（展示值 → 存储值）
    const componentOnChange = quickParser
      ? (newValue: unknown, ...rest: unknown[]) => handleChange(quickParser(newValue), ...rest)
      : handleChange;

    return (
      <ComponentToRender
        ref={(el: ComponentRef) => {
          if (el) {
            componentRef.current = el;
          }
        }}
        value={componentValue}
        onChange={componentOnChange}
        status={effectiveStatus}
        values={rootContext.instance.getFieldsValue()}
        schema={resolvedSchema}
        field={fieldNode}
        form={rootContext.instance}
        {...additionalProps}
        {...restComponentProps}
        style={{ width: '100%', ...(userStyle as Record<string, unknown>) }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  };

  // ========== 校验规则 ==========
  /**
   * 根据 computedRequired 动态生成 Arco Form.Item 的 required 规则。
   * 规则消息使用 resolvedSchema.label 或 fieldName 作为提示文案。
   */
  const finalRules = useMemo(() => {
    const rules: { required?: boolean; message?: string }[] = [];
    if (fieldNode.computedRequired) {
      rules.push({
        required: true,
        message: `请输入${resolvedSchema.label || (Array.isArray(fieldNode.name) ? fieldNode.name.join('.') : fieldNode.name)}`,
      });
    }
    return rules;
  }, [fieldNode.computedRequired, resolvedSchema.label, fieldNode.name]);

  // ========== 校验状态映射 ==========
  const getValidateStatus = (): 'success' | 'warning' | 'error' | 'validating' | undefined => {
    if (error) {
      return 'error';
    }
    return undefined;
  };

  // Arco Form.Item 类型声明（避免 @types 缺失导致的 TS 报错）
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const FormItem = Form.Item as React.FC<{
    field?: string;
    label?: React.ReactNode;
    labelCol?: unknown;
    wrapperCol?: unknown;
    rules?: { required?: boolean; message?: string }[];
    initialValue?: unknown;
    tooltip?: React.ReactNode;
    extra?: React.ReactNode;
    validateStatus?: 'success' | 'warning' | 'error' | 'validating';
    help?: string | undefined;
    children?: React.ReactNode;
  }>;

  // ========== 渲染 ==========
  return (
    <FieldContextProvider value={fieldContextValue}>
      <div data-field-name={fieldName}>
        {/*
         * Arco Form.Item：
         * - field: 字段名，用于 ArcoForm 的值绑定和校验
         * - rules: 动态 required 规则
         * - validateStatus / help: 错误态展示
         */}
        <FormItem
          field={fieldName}
          label={displayLabel}
          labelCol={resolvedSchema.labelCol || layoutContext.labelCol}
          wrapperCol={resolvedSchema.wrapperCol || layoutContext.wrapperCol}
          rules={finalRules}
          initialValue={fieldNode.schema.initialValue}
          tooltip={displayTooltip}
          extra={displayExtra}
          validateStatus={getValidateStatus()}
          help={error}
        >
          {renderComponent()}
        </FormItem>
      </div>
    </FieldContextProvider>
  );
};

/**
 * FormField
 *
 * ProForm 表单项的"胶水"组件，职责：
 * 1. 根据 schema 创建/复用 FieldNode 实例，注册到 FormStore
 * 2. 构建 SchemaContext（供子组件消费 schema 元数据）
 * 3. 继承并合并布局上下文（LayoutContext）
 * 4. 组件卸载时从 FormStore 注销该字段
 *
 * 渲染结构：
 * SchemaContextProvider → LayoutContextProvider → FormFieldInner → Arco Form.Item
 */
export const FormField: React.FC<FormFieldProps> = ({
  schema,
  formStore,
  arcoForm,
  setComponentRef,
  onFieldChange,
}) => {
  const layoutContext = useLayoutContext();

  // ========== 创建/复用 FieldNode ==========
  /**
   * 优先从 FormStore 查找已有 FieldNode（schema 展开时复用），
   * 不存在则创建新节点并注册到 store。
   * 组件卸载时自动注销。
   */
  const fieldNode = useMemo(() => {
    const existingField = formStore.getField(schema.name);
    if (existingField) {
      return existingField;
    }
    const newField = createFieldNode(schema, formStore);
    formStore.registerField(newField);
    return newField;
  }, [schema, formStore]);

  useEffect(() => {
    return () => {
      formStore.unregisterField(schema.name);
    };
  }, [schema.name, formStore]);

  const resolvedSchema = fieldNode.resolvedSchema;

  // ========== 构建 SchemaContext ==========
  /**
   * 将 resolvedSchema 展开为扁平结构注入上下文，
   * 供内部组件（FormFieldInner 及其子组件）通过 useSchemaContext 消费。
   * 包含字段元数据、校验规则、布局参数、只读配置等。
   */
  const schemaContextValue = useMemo(
    () => ({
      name: schema.name,
      label: resolvedSchema.label,
      component: resolvedSchema.component,
      componentProps: resolvedSchema.componentProps,
      rules: resolvedSchema.rules,
      dependencies: schema.dependencies,
      behavior: schema.behavior,
      reactions: schema.reactions,
      lifecycle: schema.lifecycle,
      initialValue: schema.initialValue,
      col: resolvedSchema.col,
      labelCol: resolvedSchema.labelCol,
      wrapperCol: resolvedSchema.wrapperCol,
      tooltip: resolvedSchema.tooltip,
      extra: resolvedSchema.extra,
      placeholder: resolvedSchema.placeholder,
      options: resolvedSchema.options,
      format: resolvedSchema.format,
      valueFormat: resolvedSchema.valueFormat,
      prefix: resolvedSchema.prefix,
      suffix: resolvedSchema.suffix,
      required: schema.required,
      requiredMessage: resolvedSchema.requiredMessage,
      readonlyMode: resolvedSchema.readonlyMode,
      readonlyConfig: resolvedSchema.readonlyConfig,
      readonlyComponent: resolvedSchema.readonlyComponent,
      rawSchema: schema,
    }),
    [schema, resolvedSchema],
  );

  // ========== 合并布局上下文 ==========
  /**
   * 继承上层 LayoutContext，并用当前字段的 col/labelCol/wrapperCol 覆盖，
   * 实现字段级别的布局覆盖能力。
   */
  const layoutContextValue = useMemo(
    () => ({
      ...layoutContext,
      col: resolvedSchema.col ?? layoutContext.col,
      labelCol: resolvedSchema.labelCol || layoutContext.labelCol,
      wrapperCol: resolvedSchema.wrapperCol || layoutContext.wrapperCol,
    }),
    [layoutContext, resolvedSchema.col, resolvedSchema.labelCol, resolvedSchema.wrapperCol],
  );

  // ========== 递归渲染子字段 ==========
  /**
   * 当 schema 声明了 children 时，在父字段下方递归渲染子 FormField。
   * 子字段共享同一个 formStore / arcoForm，独立注册到 FormStore。
   */
  const childFields = useMemo(() => {
    if (!schema.children || schema.children.length === 0) return null;
    return schema.children.map((childSchema, index) => {
      const key = (Array.isArray(childSchema.name) ? childSchema.name[0] : childSchema.name) || index;
      return (
        <FormField
          key={key}
          schema={childSchema}
          formStore={formStore}
          arcoForm={arcoForm}
          setComponentRef={setComponentRef}
          onFieldChange={childSchema.onFieldChange}
        />
      );
    });
  }, [schema.children, formStore, arcoForm, setComponentRef]);

  return (
    <SchemaContextProvider value={schemaContextValue}>
      <LayoutContextProvider value={layoutContextValue}>
        <FormFieldInner
          fieldNode={fieldNode}
          arcoForm={arcoForm}
          setComponentRef={setComponentRef}
          onFieldChange={onFieldChange}
        />
        {childFields && <div className='proform-children'>{childFields}</div>}
      </LayoutContextProvider>
    </SchemaContextProvider>
  );
};
