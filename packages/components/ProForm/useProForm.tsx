import React, { useRef, useState, useCallback, useMemo, useContext, createContext } from 'react';
import type { ProFormInstance, ProFormSchema, FieldStatus, ProFormProps } from './types';
import { FormStore, createFormStore } from './core/FormStore';
import { useArcoForm, type ArcoFormInstance } from './hooks/useArcoForm';
import { useFieldNavigation, type UseFieldNavigationReturn } from './hooks/useFieldNavigation';

/**
 * ProForm Context
 */
export interface ProFormContextValue<TValues = Record<string, unknown>> {
  formStore: FormStore | null;
  instance: ProFormInstance<TValues> | null;
  arcoForm: ArcoFormInstance | null;
}

export const ProFormContext = createContext<ProFormContextValue>({
  formStore: null,
  instance: null,
  arcoForm: null,
});

/**
 * 使用 ProFormContext 的 Hook
 * 与 ProTable 的 useProTableContext 保持一致的 API 风格
 */
export const useProFormContext = <TValues = Record<string, unknown>,>(): ProFormContextValue<TValues> => {
  return useContext(ProFormContext) as ProFormContextValue<TValues>;
};

/**
 * useProForm Hook 配置选项
 */
export interface UseProFormOptions<TValues = Record<string, unknown>> extends Omit<ProFormProps<TValues>, 'schemas'> {
  schemas?: ProFormSchema<TValues>[];
  initialValues?: Partial<TValues>;
  onValuesChange?: (changedValues: Partial<TValues>, allValues: TValues) => void;
  onFieldsChange?: (changedFields: unknown, allFields: unknown) => void;
}

/**
 * useProForm Hook 返回值
 */
export interface UseProFormReturn<TValues = Record<string, unknown>> {
  arcoForm: ArcoFormInstance;
  instance: ProFormInstance<TValues>;
  schemas: ProFormSchema<TValues>[];
  setSchemas: (schemas: ProFormSchema<TValues>[]) => void;
  formProps: Partial<ProFormProps<TValues>>;
  setComponentRef: (name: string, ref: unknown) => void;
  fieldStatusMap: Record<string, FieldStatus>;
  setFieldStatusMap: (statusMap: Record<string, FieldStatus>) => void;
  isDraftState: boolean;
  setIsDraftState: (draft: boolean) => void;
  isPreviewState: boolean;
  setIsPreviewState: (preview: boolean) => void;
  options: UseProFormOptions<TValues>;
  bindingProps: ProFormProps<TValues>;
  formStore: FormStore;
  /** Provider 组件，用于包裹子组件 */
  Provider: React.FC<{ children: React.ReactNode }>;
  /** 键盘导航功能 */
  fieldNavigation: UseFieldNavigationReturn;
}

/**
 * ProForm 核心 Hook
 */
export const useProForm = <TValues = Record<string, unknown>,>(
  options: UseProFormOptions<TValues> = {},
): UseProFormReturn<TValues> => {
  const {
    schemas: initialSchemas,
    layout,
    labelCol,
    wrapperCol,
    colon,
    labelAlign,
    size,
    disabled,
    readonly,
    draft,
    preview,
    initialValues,
    onFinish,
    onFinishFailed,
    onValuesChange,
    onFieldsChange,
    onDraftChange,
    onPreviewChange,
    showButton,
    submitText,
    resetText,
    submitLoading,
    resetLoading,
    buttonPosition,
    collapsible,
    collapsed,
    defaultCollapsed,
    expandText,
    collapseText,
    collapsedRows,
    onCollapseChange,
    rows,
    buttons,
    buttonList,
    okButtonProps,
    cancelButtonProps,
    rowProps,
    colProps,
    columns,
    gutter,
    className,
    style,
    formRef: formRefProp,
    scrollToFirstError,
    validateTrigger,
    labelColProps,
    wrapperColProps,
    cardContainer,
    keyboardNavigation,
  } = options;

  const [schemas, setSchemasState] = useState<ProFormSchema<TValues>[]>(initialSchemas || []);
  const componentRefs = useRef<Record<string, unknown>>({});
  const [formProps, setFormPropsState] = useState<Partial<ProFormProps<TValues>>>({});
  const [fieldStatusMap, setFieldStatusMap] = useState<Record<string, FieldStatus>>({});
  const [isDraftState, setIsDraftState] = useState(draft || false);
  const [isPreviewState, setIsPreviewState] = useState(preview || false);

  // 创建 FormStore
  const formStore = useMemo(() => createFormStore(), []);

  // 创建 Arco Form 兼容实例
  const arcoForm = useArcoForm(formStore);

  // 先定义 getRef，用于键盘导航
  const getRef = useCallback(
    <R = unknown,>(name: string): R | undefined => componentRefs.current[name] as R | undefined,
    [],
  );

  // 使用键盘导航
  const fieldNavigation = useFieldNavigation({
    schemas,
    getRef,
    keyboardNavigation,
    onFocusField: (name) => {
      const field = formStore.getField(name);
      if (field) {
        field.setFocus();
      }
    },
    onBlurField: (name) => {
      const field = formStore.getField(name);
      if (field) {
        field.removeFocus();
      }
    },
  });

  /**
   * 验证所有字段
   */
  const validate = useCallback(async (): Promise<TValues> => {
    const values = await arcoForm.validate();
    return values as TValues;
  }, [arcoForm]);

  /**
   * 验证指定字段
   */
  const validateField = useCallback(
    async (name: string | string[]) => {
      const names = Array.isArray(name) ? name : [name];
      return await arcoForm.validate(names);
    },
    [arcoForm],
  );

  /**
   * 清除验证信息
   */
  const clearValidate = useCallback(
    (name?: string | string[]) => {
      if (name) {
        const names = Array.isArray(name) ? name : [name];
        names.forEach((n) => arcoForm.setFields({ [n]: { error: undefined } }));
      } else {
        const fields = arcoForm.getFields();
        Object.keys(fields).forEach((n) => arcoForm.setFields({ [n]: { error: undefined } }));
      }
    },
    [arcoForm],
  );

  /**
   * 批量设置字段值
   */
  const setFieldsValue = useCallback(
    (values: Partial<TValues>) => {
      arcoForm.setFieldsValue(values);
    },
    [arcoForm],
  );

  /**
   * 设置单个字段值
   */
  const setFieldValue = useCallback(
    <K extends keyof TValues>(name: K, value: TValues[K]) => {
      arcoForm.setFieldValue(name as string, value);
    },
    [arcoForm],
  );

  /**
   * 获取单个字段值
   */
  const getFieldValue = useCallback(
    <K extends keyof TValues>(name: K): TValues[K] => arcoForm.getFieldValue(name as string) as TValues[K],
    [arcoForm],
  );

  /**
   * 获取所有字段值
   */
  const getFieldsValue = useCallback(
    (nameList?: Array<keyof TValues>) => {
      const allValues = arcoForm.getFieldsValue();
      if (!nameList) {
        return allValues as TValues;
      }
      const result: Partial<TValues> = {};
      nameList.forEach((name) => {
        result[name] = allValues[name as string] as TValues[typeof name];
      });
      return result as TValues;
    },
    [arcoForm],
  );

  /**
   * 动态更新表单配置
   */
  const setSchemas = useCallback((newSchemas: ProFormSchema<TValues>[]) => {
    setSchemasState(newSchemas);
  }, []);

  /**
   * 动态更新表单属性
   */
  const setProps = useCallback((props: Partial<ProFormProps<TValues>>) => {
    setFormPropsState((prev) => ({ ...prev, ...props }));
  }, []);

  /**
   * 重置字段值
   */
  const resetFields = useCallback(
    (nameList?: Array<keyof TValues>) => {
      if (nameList) {
        const names = nameList.map((n) => String(n));
        arcoForm.resetFields(names);
      } else {
        arcoForm.resetFields();
      }
    },
    [arcoForm],
  );

  /**
   * 滚动到指定字段
   */
  const scrollToField = useCallback(
    (name: string) => {
      arcoForm.scrollToField(name);
    },
    [arcoForm],
  );

  /**
   * 提交表单
   */
  const submit = useCallback(async () => await validate(), [validate]);

  /**
   * 获取字段状态
   */
  const getFieldStatus = useCallback((name: string): FieldStatus => fieldStatusMap[name] || 'edit', [fieldStatusMap]);

  /**
   * 设置字段状态
   */
  const setFieldStatus = useCallback((name: string, status: FieldStatus) => {
    setFieldStatusMap((prev) => ({ ...prev, [name]: status }));
  }, []);

  /**
   * 判断是否为草稿模式
   */
  const isDraft = useCallback(() => isDraftState, [isDraftState]);

  /**
   * 设置草稿模式
   */
  const setDraft = useCallback(
    (draftValue: boolean) => {
      setIsDraftState(draftValue);
      onDraftChange?.(draftValue);
    },
    [onDraftChange],
  );

  /**
   * 判断是否为预览模式
   */
  const isPreview = useCallback(() => isPreviewState, [isPreviewState]);

  /**
   * 设置预览模式
   */
  const setPreview = useCallback(
    (previewValue: boolean) => {
      setIsPreviewState(previewValue);
      onPreviewChange?.(previewValue);
    },
    [onPreviewChange],
  );

  /**
   * 获取指定字段的聚焦状态
   */
  const getFieldFocused = useCallback(
    (name: string): boolean => {
      const field = formStore.getField(name);
      return field?.focused || false;
    },
    [formStore],
  );

  /**
   * ProForm 实例对象
   */
  const instance: ProFormInstance<TValues> = {
    validate,
    validateField,
    clearValidate,
    setFieldsValue,
    setFieldValue,
    getFieldValue,
    getFieldsValue,
    getRef,
    setSchemas,
    setProps,
    resetFields,
    scrollToField,
    submit,
    getFieldStatus,
    setFieldStatus,
    isDraft,
    setDraft,
    isPreview,
    setPreview,
    focusField: fieldNavigation.focusField,
    focusNextField: fieldNavigation.focusNextField,
    focusPrevField: fieldNavigation.focusPrevField,
    getFocusedField: () => fieldNavigation.focusedField,
    getFieldFocused,
  };

  /**
   * 设置组件引用
   */
  const setComponentRef = useCallback((name: string, ref: unknown) => {
    componentRefs.current[name] = ref;
  }, []);

  /**
   * 组合 bindingProps
   */
  const bindingProps = useMemo<ProFormProps<TValues>>(
    () => ({
      schemas,
      layout,
      labelCol,
      wrapperCol,
      colon,
      labelAlign,
      size,
      disabled,
      readonly,
      draft: isDraftState,
      preview: isPreviewState,
      initialValues,
      onFinish,
      onFinishFailed,
      onValuesChange,
      onFieldsChange,
      onDraftChange,
      onPreviewChange,
      showButton,
      submitText,
      resetText,
      submitLoading,
      resetLoading,
      buttonPosition,
      collapsible,
      collapsed,
      defaultCollapsed,
      expandText,
      collapseText,
      collapsedRows,
      onCollapseChange,
      rows,
      buttons,
      buttonList,
      okButtonProps,
      cancelButtonProps,
      rowProps,
      colProps,
      columns,
      gutter,
      className,
      style,
      formRef: formRefProp,
      scrollToFirstError,
      validateTrigger,
      labelColProps,
      wrapperColProps,
      cardContainer,
      keyboardNavigation,
    }),
    [
      schemas,
      layout,
      labelCol,
      wrapperCol,
      colon,
      labelAlign,
      size,
      disabled,
      readonly,
      isDraftState,
      isPreviewState,
      initialValues,
      onFinish,
      onFinishFailed,
      onValuesChange,
      onFieldsChange,
      onDraftChange,
      onPreviewChange,
      showButton,
      submitText,
      resetText,
      submitLoading,
      resetLoading,
      buttonPosition,
      collapsible,
      collapsed,
      defaultCollapsed,
      expandText,
      collapseText,
      collapsedRows,
      onCollapseChange,
      rows,
      buttons,
      buttonList,
      okButtonProps,
      cancelButtonProps,
      rowProps,
      colProps,
      columns,
      gutter,
      className,
      style,
      formRefProp,
      scrollToFirstError,
      validateTrigger,
      labelColProps,
      wrapperColProps,
      cardContainer,
      keyboardNavigation,
    ],
  );

  // 创建 Provider 组件
  const Provider = useMemo(() => {
    const ProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ProFormContext.Provider
        value={{
          formStore,
          instance: instance as ProFormInstance,
          arcoForm,
        }}
      >
        {children}
      </ProFormContext.Provider>
    );
    return ProviderComponent;
  }, [formStore, instance, arcoForm]);

  return {
    arcoForm,
    instance,
    schemas,
    setSchemas,
    formProps,
    setComponentRef,
    fieldStatusMap,
    setFieldStatusMap,
    isDraftState,
    setIsDraftState,
    isPreviewState,
    setIsPreviewState,
    options: {
      initialValues,
      onValuesChange,
      onFieldsChange,
    } satisfies UseProFormOptions<TValues>,
    bindingProps,
    formStore,
    Provider,
    fieldNavigation,
  };
};

/**
 * ProForm Provider 组件
 * 用于提供表单上下文
 */
export const ProFormProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <>{children}</>;
