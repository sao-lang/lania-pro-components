import { useRef, useState, useCallback, useMemo } from 'react';
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
import { createProProvider, useVirtualScroll } from '@lania-pro-components/shared';
import { useFieldNavigation } from './hooks/useFieldNavigation';
import { ProFormContextValue, UsrProFormFn } from './types';

const { useContext: useProFormContextInner, Context: ProFormContext } =
  createProProvider<ProFormContextValue>('ProForm');

export { ProFormContext };

export const useProFormContext: UsrProFormFn = () => {
  return useProFormContextInner() as ProFormContextValue;
};

// ===== 内部 Hook：纯数据层 =====
function useFormStore() {
  const formStore = useMemo(() => createFormStore(), []);
  const arcoForm = useArcoForm(formStore);

  const validate = useCallback(async (): Promise<Record<string, unknown>> => {
    const errors = await formStore.validateAllFields();
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
    return formStore.getValues();
  }, [arcoForm, formStore]);

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

  const clearValidate = useCallback(
    (name?: string | string[]) => {
      if (name) {
        const names = Array.isArray(name) ? name : [name];
        names.forEach((n) => {
          formStore.setFieldError(n, undefined);
          arcoForm.setFields({ [n]: { error: undefined } });
        });
      } else {
        formStore.clearErrors();
        const fields = formStore.getAllFields();
        const errorFields: Record<string, { error: undefined }> = {};
        fields.forEach((_, fname) => {
          errorFields[fname] = { error: undefined };
        });
        if (Object.keys(errorFields).length > 0) {
          arcoForm.setFields(errorFields);
        }
      }
    },
    [formStore, arcoForm],
  );

  const setFieldsValue = useCallback(
    (values: Record<string, unknown>) => {
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

  const setFieldValue = useCallback(
    (name: string, value: unknown) => {
      const field = formStore.getField(name);
      if (field) {
        field.setValue(value);
      } else {
        arcoForm.setFieldValue(name, value);
      }
    },
    [formStore, arcoForm],
  );

  const getFieldValue = useCallback((name: string) => formStore.getField(name)?.getValue(), [formStore]);

  const getFieldsValue = useCallback(
    (nameList?: string[]) => {
      const result: Record<string, unknown> = {};
      const fields = formStore.getAllFields();
      fields.forEach((field, name) => {
        result[name] = field.getValue();
      });
      if (!nameList) return result;
      const picked: Record<string, unknown> = {};
      nameList.forEach((name) => {
        picked[name] = result[name];
      });
      return picked;
    },
    [formStore],
  );

  const resetFields = useCallback(
    (nameList?: string[]) => {
      if (nameList) {
        nameList.forEach((name) => formStore.resetField(name));
      } else {
        formStore.reset();
      }
    },
    [formStore],
  );

  const submit = useCallback(async () => validate(), [validate]);

  const getFieldFocused = useCallback(
    (name: string): boolean => formStore.getField(name)?.focused || false,
    [formStore],
  );

  const baseInstance: Partial<ProFormInstance> = {
    validate,
    validateField,
    clearValidate,
    setFieldsValue,
    setFieldValue,
    getFieldValue,
    getFieldsValue,
    resetFields,
    submit,
    getFieldFocused,
  };

  return { formStore, arcoForm, baseInstance };
}

// ===== 内部 Hook：UI 能力层 =====
function useFormUI<TValues = Record<string, unknown>>(
  schemas: ProFormSchema<TValues>[],
  formStore: ReturnType<typeof createFormStore>,
  arcoForm: ReturnType<typeof useArcoForm>,
  options: {
    keyboardNavigation?: ProFormProps['keyboardNavigation'];
    onFieldFocus?: (name: string) => void;
    onFieldBlur?: (name: string) => void;
    performance?: ProFormProps['performance'];
  },
) {
  const componentRefs = useRef<Record<string, unknown>>({});
  const [fieldStatusMap, setFieldStatusMap] = useState<Record<string, FieldStatus>>({});
  const [isDraftState, setIsDraftState] = useState(false);
  const [isPreviewState, setIsPreviewState] = useState(false);

  const getRef = useCallback(((name: string) => componentRefs.current[name]) as GetComponentRefFn, []);

  const setComponentRef = useCallback((name: string, ref: unknown) => {
    componentRefs.current[name] = ref;
  }, []);

  const fieldNavigation = useFieldNavigation({
    schemas,
    getRef,
    keyboardNavigation: options.keyboardNavigation,
    formStore,
    onFocus: options.onFieldFocus,
    onBlur: options.onFieldBlur,
  });

  const virtualScrollConfig = options.performance?.virtualScroll;
  const {
    containerRef: virtualContainerRef,
    virtualState,
    scrollToIndex,
  } = useVirtualScroll(schemas, {
    itemHeight: virtualScrollConfig?.itemHeight || 60,
    overscan: virtualScrollConfig?.overscan || 5,
    containerHeight: virtualScrollConfig?.containerHeight,
  });

  const scrollToField = useCallback(
    (name: string) => {
      const enabled = virtualScrollConfig?.enabled && schemas.length > 20;
      if (enabled) {
        const index = schemas.findIndex((s) => {
          const schemaName = Array.isArray(s.name) ? s.name.join('.') : s.name;
          return String(schemaName) === name;
        });
        if (index !== -1) {
          scrollToIndex(index);
          return;
        }
      }
      arcoForm.scrollToField(name);
    },
    [arcoForm, schemas, scrollToIndex, virtualScrollConfig?.enabled],
  );

  const getFieldStatus = useCallback((name: string): FieldStatus => fieldStatusMap[name] || 'edit', [fieldStatusMap]);

  const setFieldStatus = useCallback((name: string, status: FieldStatus) => {
    setFieldStatusMap((prev) => ({ ...prev, [name]: status }));
  }, []);

  const uiMethods = {
    getRef,
    setComponentRef,
    focusField: fieldNavigation.focusField,
    focusNextField: fieldNavigation.focusNextField,
    focusPrevField: fieldNavigation.focusPrevField,
    getFocusedField: () => fieldNavigation.focusedField,
    scrollToField,
    getFieldStatus,
    setFieldStatus,
    isDraft: () => isDraftState,
    setDraft: (v: boolean) => setIsDraftState(v),
    isPreview: () => isPreviewState,
    setPreview: (v: boolean) => setIsPreviewState(v),
  };

  return {
    setComponentRef,
    fieldNavigation,
    virtualState,
    virtualContainerRef,
    fieldStatusMap,
    setFieldStatusMap,
    isDraftState,
    setIsDraftState,
    isPreviewState,
    setIsPreviewState,
    uiMethods,
  };
}

// ===== 公开 Hook：组合数据层 + UI 层 =====
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
    performance,
    onFieldFocus,
    onFieldBlur,
  } = options;

  const [schemas, setSchemasState] = useState<ProFormSchema<TValues>[]>(initialSchemas || []);
  const [formProps, setFormPropsState] = useState<Partial<ProFormProps<TValues>>>({});

  // 数据层
  const { formStore, arcoForm, baseInstance } = useFormStore();

  // UI 能力层
  // const draftPreview = useMemo(
  //   () => ({ isDraftState: draft || false, isPreviewState: preview || false }),
  //   [draft, preview],
  // );

  const {
    setComponentRef,
    fieldNavigation,
    virtualState,
    virtualContainerRef,
    fieldStatusMap,
    setFieldStatusMap,
    isDraftState,
    setIsDraftState,
    isPreviewState,
    setIsPreviewState,
    uiMethods,
  } = useFormUI(schemas, formStore, arcoForm, { keyboardNavigation, onFieldFocus, onFieldBlur, performance });

  // 同步 draft/preview 外部 prop 到内部 state
  if (draft !== undefined && draft !== isDraftState) {
    setIsDraftState(draft);
  }
  if (preview !== undefined && preview !== isPreviewState) {
    setIsPreviewState(preview);
  }

  const getRef = uiMethods.getRef;

  const setSchemas = useCallback((newSchemas: ProFormSchema<TValues>[]) => {
    setSchemasState(newSchemas);
  }, []);

  const setProps = useCallback((props: Partial<ProFormProps<TValues>>) => {
    setFormPropsState((prev) => ({ ...prev, ...props }));
  }, []);

  /** ProForm 实例对象 */
  const instance: ProFormInstance<TValues> = useMemo(() => {
    const getFocusedField = () => fieldNavigation.focusedField;
    return {
      ...baseInstance,
      ...uiMethods,
      setSchemas,
      setProps,
      getRef,
      getFocusedField,
    } as ProFormInstance<TValues>;
  }, [baseInstance, uiMethods, setSchemas, setProps, getRef, fieldNavigation.focusedField]);

  /** 组合 bindingProps */
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
    fieldNavigation,
    virtualState,
    virtualContainerRef,
  };
};
