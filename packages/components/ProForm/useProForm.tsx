import React, { useRef, useState, useCallback, useMemo } from 'react';
import type {
  ProFormInstance,
  ProFormSchema,
  FieldStatus,
  ProFormProps,
  UseProFormOptions,
  UseProFormReturn,
  GetComponentRefFn,
} from './types';
import { createFormStore } from './core/FormStore';
import { useArcoForm } from './hooks/useArcoForm';
import { createProProvider } from '@lania-pro-components/shared';
import { useFieldNavigation } from './hooks/useFieldNavigation';
import { ProFormContextValue, UsrProFormFn } from './types';

/**
 * ProForm Context
 */
// export interface ProFormContextValue<TValues = Record<string, unknown>> {
//   formStore: FormStore | null;
//   instance: ProFormInstance<TValues> | null;
//   arcoForm: ArcoFormInstance | null;
// }

const { useContext: useProFormContextInner, Context: ProFormContext } =
  createProProvider<ProFormContextValue>('ProForm');

// 重新导出，保持命名一致
export { ProFormContext };

/**
 * 使用 ProFormContext 的 Hook
 * 与 ProTable 的 useProTableContext 保持一致的 API 风格
 */
export const useProFormContext: UsrProFormFn = () => {
  return useProFormContextInner() as ProFormContextValue;
};
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
    onFieldFocus,
    onFieldBlur,
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
  const getRef = useCallback(((name: string) => componentRefs.current[name]) as GetComponentRefFn, []);

  // 使用键盘导航
  // field.setFocus/removeFocus 始终执行（默认行为）
  // schema.keyboardNavigation.onFocus 优先于 props.onFieldFocus（自定义行为，择一）
  const fieldNavigation = useFieldNavigation({
    schemas,
    getRef,
    keyboardNavigation,
    formStore,
    onFocus: onFieldFocus,
    onBlur: onFieldBlur,
  });

  /**
   * 验证所有字段
   *
   * 通过 formStore.validateAllFields() 执行 schema.rules（含必填校验），
   * 验证的是存储值（output 转换后，即提交后端的格式）。
   * 验证完成后将错误同步到 Arco Form UI（红框、错误信息）。
   *
   * @returns 存储值（验证通过后）
   * @throws 验证失败时 reject（由 Arco Form 的 onSubmitFailed 捕获）
   */
  const validate = useCallback(async (): Promise<TValues> => {
    const errors = await formStore.validateAllFields();
    // 将 FieldNode 的错误同步到 Arco Form UI
    const errorFields: Record<string, { error?: { message?: string } }> = {};
    let hasError = false;
    Object.entries(errors).forEach(([name, msg]) => {
      if (msg) {
        hasError = true;
        errorFields[name] = { error: { message: msg } };
      } else {
        errorFields[name] = { error: undefined };
      }
    });
    if (Object.keys(errorFields).length > 0) {
      arcoForm.setFields(errorFields);
    }
    if (hasError) {
      return Promise.reject(errors);
    }
    return formStore.getValues() as TValues;
  }, [arcoForm, formStore]);

  /**
   * 验证指定字段
   *
   * 通过 formStore.validateField() 执行 schema.rules，验证存储值，
   * 并将错误同步到 Arco Form UI。
   */
  const validateField = useCallback(
    async (name: string | string[]) => {
      const names = Array.isArray(name) ? name : [name];
      const results: Record<string, string | undefined> = {};
      let hasError = false;
      for (const n of names) {
        const err = await formStore.validateField(n);
        results[n] = err;
        if (err) hasError = true;
      }
      // 同步到 Arco Form UI
      const errorFields: Record<string, { error?: { message?: string } | undefined }> = {};
      names.forEach((n) => {
        errorFields[n] = results[n] ? { error: { message: results[n] } } : { error: undefined };
      });
      arcoForm.setFields(errorFields);
      if (hasError) {
        return Promise.reject(results);
      }
    },
    [arcoForm, formStore],
  );

  /**
   * 清除验证信息
   *
   * 同时清除 formStore 的错误状态和 Arco Form 的错误 UI。
   */
  const clearValidate = useCallback(
    (name?: string | string[]) => {
      if (name) {
        const names = Array.isArray(name) ? name : [name];
        names.forEach((n) => {
          formStore.setFieldError(n, undefined);
          arcoForm.setFields({ [n]: { error: undefined } });
        });
      } else {
        // 清除所有错误
        formStore.clearErrors();
        const fields = formStore.getAllFields();
        const errorFields: Record<string, { error: undefined }> = {};
        fields.forEach((_, name) => {
          errorFields[name] = { error: undefined };
        });
        if (Object.keys(errorFields).length > 0) {
          arcoForm.setFields(errorFields);
        }
      }
    },
    [formStore, arcoForm],
  );

  /**
   * 批量设置字段值
   *
   * 接收组件值（用户操作形态），经过 transform.output 转换为存储值后写入内部状态。
   * 通过 fieldNode.setValue 触发完整的值更新链路（响应式同步 + 回调通知）。
   */
  const setFieldsValue = useCallback(
    (values: Partial<TValues>) => {
      Object.entries(values).forEach(([name, value]) => {
        const field = formStore.getField(name);
        if (field) {
          field.setValue(value);
        } else {
          arcoForm.setFieldValue(name, value);
        }
      });
    },
    [formStore, arcoForm],
  );

  /**
   * 设置单个字段值
   *
   * 接收组件值（用户操作形态），经过 transform.output 转换为存储值后写入内部状态。
   */
  const setFieldValue = useCallback(
    <K extends keyof TValues>(name: K, value: TValues[K]) => {
      const field = formStore.getField(name as string);
      if (field) {
        field.setValue(value);
      } else {
        arcoForm.setFieldValue(name as string, value);
      }
    },
    [formStore, arcoForm],
  );

  /**
   * 获取单个字段值（组件值，经过 transform.input 转换）
   *
   * formStore 是唯一数据源。
   */
  const getFieldValue = useCallback(
    <K extends keyof TValues>(name: K): TValues[K] => {
      const field = formStore.getField(name as string);
      return field?.getValue() as TValues[K];
    },
    [formStore],
  );

  /**
   * 获取所有字段值（组件值，经过 transform.input 转换）
   *
   * formStore 是唯一数据源，所有字段都注册在 formStore 中。
   */
  const getFieldsValue = useCallback(
    (nameList?: Array<keyof TValues>) => {
      // 从 formStore 获取所有字段的组件值（唯一数据源）
      const result: Record<string, unknown> = {};
      const fields = formStore.getAllFields();
      fields.forEach((field, name) => {
        result[name] = field.getValue();
      });

      if (!nameList) {
        return result as TValues;
      }

      const picked: Partial<TValues> = {};
      nameList.forEach((name) => {
        picked[name] = result[name as string] as TValues[typeof name];
      });
      return picked as TValues;
    },
    [formStore],
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
   * 重置字段值到 initialValue
   *
   * initialValue 为存储值格式，重置后组件显示的值会经过 transform.input 转换。
   */
  const resetFields = useCallback(
    (nameList?: Array<keyof TValues>) => {
      if (nameList) {
        const names = nameList.map((n) => String(n));
        names.forEach((name) => formStore.resetField(name));
      } else {
        formStore.reset();
      }
    },
    [formStore],
  );

  /**
   * 滚动到指定字段
   *
   * 默认走 arcoForm.scrollToField（DOM scrollIntoView）。
   * 开启虚拟滚动时由 ProForm 组件通过 setScrollToFieldImpl 注入基于索引的滚动实现，
   * 因为虚拟滚动下未渲染的字段没有 DOM 元素，arcoForm 的方式会失效。
   */
  const scrollToFieldImplRef = useRef<((name: string) => void) | null>(null);

  const scrollToField = useCallback(
    (name: string) => {
      if (scrollToFieldImplRef.current) {
        scrollToFieldImplRef.current(name);
      } else {
        arcoForm.scrollToField(name);
      }
    },
    [arcoForm],
  );

  /**
   * 注入 scrollToField 实现（内部使用）
   *
   * 由 ProForm 组件在虚拟滚动开启时调用，外部无需关心。
   */
  const setScrollToFieldImpl = useCallback((fn: ((name: string) => void) | null) => {
    scrollToFieldImplRef.current = fn;
  }, []);

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
      onFieldFocus,
      onFieldBlur,
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
      onFieldFocus,
      onFieldBlur,
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
    setScrollToFieldImpl,
  };
};

/**
 * ProForm Provider 组件
 * 用于提供表单上下文
 */
export const ProFormProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <>{children}</>;
