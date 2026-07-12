import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  ProFormInstance,
  ProFormSchema,
  ProFormProps,
  UseProFormOptions,
  UseProFormReturn,
} from '../types';
import { createFormStore } from '../core/FormStore';
import { useArcoForm } from './useArcoForm';
import { createProProvider } from '@lania-pro-components/shared';
import { ProFormContextValue, UsrProFormFn } from '../types';

const { useContext: useProFormContextInner, Context: ProFormContext } =
  createProProvider<ProFormContextValue>('ProForm');

export { ProFormContext };

export const useProFormContext: UsrProFormFn = () => {
  return useProFormContextInner() as ProFormContextValue;
};

/** @internal 桩函数，ProFormRenderer 挂载后通过 useEffect 覆写 */
const noop = () => {};

/**
 * useFormStore �?纯数据层内部 Hook�? *
 * 职责�? * - 创建 FormStore（数据仓库）�?arcoForm（Arco Form 桥接实例�? * - 提供纯数据操作方法：validate / setFieldsValue / getFieldsValue / resetFields / submit
 * - 不涉及任�?UI 状态（聚焦、虚拟滚动、草稿模式等�? *
 * 返回值中 baseInstance �?ProFormInstance 的数据子集，
 * �?useProForm 组合 useFormUI �?UI 方法后合并为完整实例�? */
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
        }

        arcoForm.setFieldValue(name, value);
      });
    },
    [formStore, arcoForm],
  );

  const setFieldValue = useCallback(
    (name: string, value: unknown) => {
      const field = formStore.getField(name);
      if (field) {
        field.setValue(value);
      }
      arcoForm.setFieldValue(name, value);
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
        nameList.forEach((name) => {
          formStore.resetField(name);
        });
      } else {
        formStore.reset();
      }
      arcoForm.resetFields(nameList);
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

// ===== 公开 Hook：组合数据层 + UI �?=====
export const useProForm = <TValues = Record<string, unknown>,>(
  options: UseProFormOptions<TValues> = {},
): UseProFormReturn<TValues> => {
  const { schemas: initialSchemas } = options;

  const [schemas, setSchemasState] = useState<ProFormSchema<TValues>[]>(initialSchemas || []);
  const [dynamicProps, setDynamicProps] = useState<Partial<ProFormProps<TValues>>>({});

  const { formStore, arcoForm, baseInstance } = useFormStore();

  const bindingPropsRef = useRef<ProFormProps<TValues>>({} as ProFormProps<TValues>);

  const getRef = useCallback(() => undefined, []);

  const setSchemas = useCallback((newSchemas: ProFormSchema<TValues>[]) => {
    setSchemasState(newSchemas);
  }, []);

  const setProps = useCallback((props: Partial<ProFormProps<TValues>>) => {
    setDynamicProps((prev) => ({ ...prev, ...props }));
  }, []);

  const getProps = useCallback(() => bindingPropsRef.current, []);

  /** ProForm 实例对象 �?UI 方法为桩，ProFormRenderer 挂载后通过 useEffect 覆写 */
  const instance: ProFormInstance<TValues> = useMemo(
    () =>
      ({
        ...baseInstance,
        store: formStore,
        arcoForm,
        setSchemas,
        getSchemas: () => schemas,
        setProps,
        getProps,
        getRef,
        focusField: noop,
        focusNextField: noop,
        focusPrevField: noop,
        getFocusedField: () => undefined,
        scrollToField: noop,
        getFieldStatus: () => 'edit',
        setFieldStatus: noop,
        isDraft: () => false,
        setDraft: noop,
        isPreview: () => false,
        setPreview: noop,
        getFieldFocused: (name: string): boolean => formStore.getField(name)?.focused || false,
        getFieldStatusMap: () => ({}),
        setFieldStatusMap: noop as ProFormInstance['setFieldStatusMap'],
      }) as ProFormInstance<TValues>,
    [baseInstance, setSchemas, setProps, getProps, getRef, formStore],
  );

  /** 组合 bindingProps */
  const bindingProps = useMemo<ProFormProps<TValues>>(() => {
    const props = {
      ...options,
      schemas,
      ...dynamicProps,
    };
    bindingPropsRef.current = props;
    return props;
  }, [options, schemas, dynamicProps]);

  return {
    arcoForm,
    instance,
    bindingProps,
    store: formStore,
    setProps,
    getProps,
  };
};
