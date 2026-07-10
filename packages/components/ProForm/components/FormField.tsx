import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Form } from '@arco-design/web-react';
import type { ProFormSchema, FieldStatus, FieldNodeAPI } from './types';
import { getComponent, parseQuickComponent, getReadonlyRenderer, getRendererByMode } from './registry';
import {
  useRootContext,
  useLayoutContext,
  SchemaContextProvider,
  FieldContextProvider,
  LayoutContextProvider,
} from './context';
import { createFieldNode } from './core/FieldNode';
import type { FormStore } from './core/FormStore';
import type { ArcoFormInstance } from './hooks/useArcoForm';

type ComponentRef = React.RefObject<HTMLElement> | null;

interface FormFieldProps {
  schema: ProFormSchema;
  formStore: FormStore;
  arcoForm: ArcoFormInstance;
  setComponentRef?: (name: string, ref: ComponentRef) => void;
  onFieldChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

interface FormFieldInnerProps {
  fieldNode: FieldNodeAPI;
  arcoForm: ArcoFormInstance;
  setComponentRef?: (name: string, ref: ComponentRef) => void;
  onFieldChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

const FormFieldInner: React.FC<FormFieldInnerProps> = ({ fieldNode, arcoForm, setComponentRef, onFieldChange }) => {
  const rootContext = useRootContext();
  const layoutContext = useLayoutContext();

  const [value, setValueState] = useState<unknown>(fieldNode.value);
  const [status, setStatusState] = useState<FieldStatus>(fieldNode.status);
  const [error, setErrorState] = useState<string | undefined>(fieldNode.error);
  const [focused, setFocused] = useState<boolean>(fieldNode.focused || false);

  const componentRef = useRef<ComponentRef>(null);

  const handleFocus = useCallback(() => {
    fieldNode.setFocus();
    setFocused(true);
  }, [fieldNode]);

  const handleBlur = useCallback(() => {
    fieldNode.removeFocus();
    setFocused(false);
  }, [fieldNode]);

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

  useEffect(() => {
    setValueState(fieldNode.value);
    setStatusState(fieldNode.status);

    const unsubscribeValue = fieldNode.subscribeToValueChange((newValue) => {
      setValueState(newValue);
      arcoForm.setFieldValue(fieldName, newValue);
    });

    const unsubscribeStatus = fieldNode.subscribeToStatusChange((newStatus) => {
      setStatusState(newStatus);
    });

    return () => {
      unsubscribeValue();
      unsubscribeStatus();
    };
  }, [fieldNode, arcoForm, fieldName]);

  useEffect(() => {
    if (setComponentRef && componentRef.current) {
      setComponentRef(fieldName, componentRef.current);
    }
  }, [fieldName, setComponentRef]);

  const handleChange = useCallback(
    (newValue: unknown, ...rest: unknown[]) => {
      const { onChange: originalOnChange } = fieldNode.schema.componentProps || {};
      if (typeof originalOnChange === 'function') {
        (originalOnChange as (value: unknown, ...args: unknown[]) => void)(newValue, ...rest);
      }

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
        fieldNode.setValue(newValue);
        arcoForm.setFieldValue(fieldName, newValue);

        onFieldChange?.(newValue, rootContext.instance.getFieldsValue());
        rootContext.onValuesChange?.({ [fieldName]: newValue }, rootContext.instance.getFieldsValue());
      }
    },
    [fieldNode, arcoForm, rootContext, onFieldChange, isRangePickerArray, rangePickerNames, fieldName],
  );

  const fieldContextValue = useMemo(
    () => ({
      name: fieldName,
      label: fieldNode.schema.label,
      value,
      values: rootContext.instance.getFieldsValue(),
      status,
      focused,
      computedBehavior: fieldNode.computedBehavior,
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
    [fieldNode, value, status, focused, error, rootContext, arcoForm, fieldName],
  );

  if (status === 'hidden') {
    return null;
  }

  const parsedQuickComponent = parseQuickComponent(fieldNode.schema.component || 'Input');

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

  const renderReadonlyContent = useMemo(() => {
    const readonlyComponentName =
      fieldNode.schema.readonlyComponent ||
      (parsedQuickComponent.type === 'normal' ? parsedQuickComponent.name : fieldNode.schema.component);

    const readonlyConfig = {
      mode: fieldNode.schema.readonlyMode,
      format: fieldNode.schema.format,
      emptyText: '--',
      prefix: parsedQuickComponent.type === 'prefix' ? parsedQuickComponent.prefix : fieldNode.schema.prefix,
      suffix: parsedQuickComponent.type === 'unit' ? parsedQuickComponent.suffix : fieldNode.schema.suffix,
      ...fieldNode.schema.readonlyConfig,
    };

    const renderer =
      readonlyConfig.mode && readonlyConfig.mode !== 'custom'
        ? getRendererByMode(readonlyConfig.mode)
        : getReadonlyRenderer(readonlyComponentName || 'Input');

    return <>{renderer(displayValue, fieldNode.schema.options, readonlyConfig, fieldNode.schema.componentProps)}</>;
  }, [fieldNode.schema, parsedQuickComponent, displayValue]);

  const renderComponent = () => {
    if (status === 'preview' || status === 'readonly') {
      return renderReadonlyContent;
    }

    let ComponentToRender: React.ComponentType<Record<string, unknown>> | undefined;
    const additionalProps: Record<string, unknown> = {};

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
      ComponentToRender = getComponent(parsedQuickComponent.name);
    } else {
      ComponentToRender = getComponent(fieldNode.schema.component || 'Input');
    }

    if (!ComponentToRender) {
      console.warn(`Component "${fieldNode.schema.component}" not found`);
      return null;
    }

    const { style: userStyle, ...restComponentProps } = fieldNode.schema.componentProps || {};
    const componentValue = getComponentValue();

    return (
      <ComponentToRender
        ref={(el: ComponentRef) => {
          if (el) {
            componentRef.current = el;
          }
        }}
        placeholder={fieldNode.schema.placeholder}
        options={fieldNode.schema.options}
        disabled={status === 'disabled'}
        {...additionalProps}
        {...restComponentProps}
        style={{ width: '100%', ...(userStyle as Record<string, unknown>) }}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={componentValue}
        name={fieldName}
        label={fieldNode.schema.label}
        focused={focused}
        error={error}
        required={fieldNode.computedRequired}
        visible={fieldNode.computedBehavior.visible}
        readonly={fieldNode.computedBehavior.readonly}
      />
    );
  };

  const finalRules = useMemo(() => {
    const rules: { required?: boolean; message?: string }[] = [];
    if (fieldNode.computedRequired) {
      rules.push({
        required: true,
        message: `请输入${fieldNode.schema.label || (Array.isArray(fieldNode.name) ? fieldNode.name.join('.') : fieldNode.name)}`,
      });
    }
    return rules;
  }, [fieldNode.computedRequired, fieldNode.schema.label, fieldNode.name]);

  const getValidateStatus = (): 'success' | 'warning' | 'error' | 'validating' | undefined => {
    if (error) {
      return 'error';
    }
    return undefined;
  };

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

  return (
    <FieldContextProvider value={fieldContextValue}>
      <div
        data-field-name={fieldName}
        style={{
          display: fieldNode.computedBehavior.visible ? undefined : 'none',
        }}
      >
        <FormItem
          field={fieldName}
          label={fieldNode.schema.label}
          labelCol={fieldNode.schema.labelCol || layoutContext.labelCol}
          wrapperCol={fieldNode.schema.wrapperCol || layoutContext.wrapperCol}
          rules={finalRules}
          initialValue={fieldNode.schema.initialValue}
          tooltip={fieldNode.schema.tooltip}
          extra={fieldNode.schema.extra}
          validateStatus={getValidateStatus()}
          help={error}
        >
          {renderComponent()}
        </FormItem>
      </div>
    </FieldContextProvider>
  );
};

export const FormField: React.FC<FormFieldProps> = ({
  schema,
  formStore,
  arcoForm,
  setComponentRef,
  onFieldChange,
}) => {
  const layoutContext = useLayoutContext();

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

  const schemaContextValue = useMemo(
    () => ({
      name: schema.name,
      label: schema.label,
      component: schema.component || 'Input',
      componentProps: schema.componentProps,
      rules: schema.rules,
      dependencies: schema.dependencies,
      behavior: schema.behavior,
      reactions: schema.reactions,
      lifecycle: schema.lifecycle,
      initialValue: schema.initialValue,
      tooltip: schema.tooltip,
      extra: schema.extra,
      placeholder: schema.placeholder,
      options: schema.options,
      format: schema.format,
      prefix: schema.prefix,
      suffix: schema.suffix,
      required: schema.required,
      readonlyMode: schema.readonlyMode,
      readonlyConfig: schema.readonlyConfig,
      readonlyComponent: schema.readonlyComponent,
      rawSchema: schema,
    }),
    [schema],
  );

  const layoutContextValue = useMemo(
    () => ({
      ...layoutContext,
      col: schema.col,
      labelCol: schema.labelCol || layoutContext.labelCol,
      wrapperCol: schema.wrapperCol || layoutContext.wrapperCol,
    }),
    [layoutContext, schema],
  );

  return (
    <SchemaContextProvider value={schemaContextValue}>
      <LayoutContextProvider value={layoutContextValue}>
        <FormFieldInner
          fieldNode={fieldNode}
          arcoForm={arcoForm}
          setComponentRef={setComponentRef}
          onFieldChange={onFieldChange}
        />
      </LayoutContextProvider>
    </SchemaContextProvider>
  );
};
