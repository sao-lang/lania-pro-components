import { ProFormProps, ProFormSchema, SchemaProcessOptions } from '../types';

class SchemaProcessor {
  private options: SchemaProcessOptions;
  constructor(options: SchemaProcessOptions = {}) {
    this.options = options;
  }
  private createStrategys(proFormProps: ProFormProps) {
    const { autoLabel, autoPlaceholder, autoAllowClear, autoRules, autoDefaultValue, autoRangePickerName } =
      this.options;
    return {
      label: (schema: ProFormSchema) => {
        if (autoLabel && schema.label === undefined) {
          const name = Array.isArray(schema.name) ? schema.name.join('.') : schema.name;
          schema.label = name.replace(/([A-Z])/g, ' $1').trim();
        }
      },
      placeholder: (schema: ProFormSchema) => {
        if (autoPlaceholder && schema.placeholder === undefined) {
          const resolvedComponent = typeof schema.component === 'function' ? 'Input' : schema.component || 'Input';
          const prefix = ['RangePicker', 'Select'].includes(resolvedComponent) ? '请选择' : '请输入';
          const isRangePicker = resolvedComponent === 'RangePicker';
          const resolvedLabel = typeof schema.label === 'function' ? undefined : schema.label;
          schema.placeholder = isRangePicker
            ? ['请选择开始时间', '请选择结束时间']
            : resolvedLabel
              ? `${prefix}${resolvedLabel}`
              : '请输入';
        }
      },
      componentProps: (schema: ProFormSchema) => {
        if (autoAllowClear) {
          const existingProps = typeof schema.componentProps === 'function' ? {} : schema.componentProps;
          schema.componentProps = { ...existingProps, allowClear: true };
        }
      },
      rules: (schema: ProFormSchema) => {
        if (autoRules && !schema.rules && schema.required) {
          const resolvedLabel = typeof schema.label === 'function' ? undefined : schema.label;
          schema.rules = [{ required: true, message: `${resolvedLabel || schema.name}不能为空` }];
        }
      },
      initialValue: (schema: ProFormSchema) => {
        const fieldName = Array.isArray(schema.name) ? schema.name[0] : schema.name;
        if (
          schema.initialValue === undefined &&
          proFormProps.initialValues &&
          fieldName in proFormProps.initialValues
        ) {
          schema.initialValue = proFormProps.initialValues[fieldName as keyof typeof proFormProps.initialValues];
        } else if (autoDefaultValue && schema.initialValue === undefined) {
          const resolvedComponent = typeof schema.component === 'function' ? 'Input' : schema.component || 'Input';
          if (['InputNumber', 'DatePicker', 'TimePicker'].includes(resolvedComponent)) {
            schema.initialValue = undefined;
          } else if (['Input', 'TextArea'].includes(resolvedComponent)) {
            schema.initialValue = '';
          } else if (['Checkbox', 'Switch'].includes(resolvedComponent)) {
            schema.initialValue = false;
          }
        }
      },
      name: (schema: ProFormSchema) => {
        const resolvedComponent = typeof schema.component === 'function' ? '' : schema.component;
        if (autoRangePickerName && resolvedComponent?.toLowerCase().includes('rangepicker')) {
          const baseName = Array.isArray(schema.name) ? schema.name[0] : schema.name;
          schema.name = [`${baseName}_start`, `${baseName}_end`];
          (schema as ProFormSchema & { _rangePickerNames?: [string, string] })._rangePickerNames = [
            `${baseName}_start`,
            `${baseName}_end`,
          ];
        }
      },
      transform: (schema: ProFormSchema) => {
        if (proFormProps.transform) {
          if (!schema.transform) schema.transform = proFormProps.transform;
          else
            schema.transform = {
              input: schema.transform.input ?? proFormProps.transform.input,
              output: schema.transform.output ?? proFormProps.transform.output,
            };
        }
      },
      lifecycle: (schema: ProFormSchema) => {
        if (!schema.lifecycle && proFormProps.lifecycle) schema.lifecycle = proFormProps.lifecycle;
      },
      valueFormat: (schema: ProFormSchema) => {
        if (!schema.valueFormat && proFormProps.valueFormat) schema.valueFormat = proFormProps.valueFormat;
      },
      format: (schema: ProFormSchema) => {
        if (!schema.format && proFormProps.dateFormat) schema.format = proFormProps.dateFormat;
      },
      keyboardNavigation: (schema: ProFormSchema) => {
        if (proFormProps.keyboardNavigation || schema.keyboardNavigation) {
          schema.keyboardNavigation = { ...proFormProps.keyboardNavigation, ...schema.keyboardNavigation };
        }
      },
    };
  }
  processSchema(schema: ProFormSchema, proFormProps: ProFormProps) {
    const processedschema = { ...schema };
    Object.values(this.createStrategys(proFormProps)).forEach((strategy) => {
      strategy(processedschema);
    });
    return processedschema;
  }
}

let schemaProcessor: SchemaProcessor;
export const createSchemaProcessor = (options: SchemaProcessOptions) => {
  if (!schemaProcessor) {
    schemaProcessor = new SchemaProcessor(options);
  }
  return schemaProcessor;
};
