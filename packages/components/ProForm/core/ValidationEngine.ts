/**
 * 验证引擎（ValidationEngine）
 *
 * 统一封装验证逻辑，所有规则执行委托给 ruleEngine。
 * 保留 FormStoreAPI 集成的能力（获取 values / fields）。
 */

import type { FieldNodeAPI, FormStoreAPI, ValidationResult } from '../types';
import { executeRule, executeRules } from '@lania-pro-components/utils';

/**
 * 验证引擎
 */
export class ValidationEngine {
  private formStore: FormStoreAPI;

  constructor(formStore: FormStoreAPI) {
    this.formStore = formStore;
  }

  /**
   * 验证单个字段
   */
  async validateField(field: FieldNodeAPI): Promise<string | undefined> {
    const { schema, value } = field;
    const values = this.formStore.getValues();
    const label = schema.label as string | undefined;

    // 1. required 快捷检查（支持函数形式的条件必填）
    const resolvedRequired = typeof schema.required === 'function' ? schema.required(values) : schema.required;
    if (resolvedRequired) {
      const error = await executeRule({ required: true, message: schema.requiredMessage }, value, values, label);
      if (error) return error;
    }

    // 2. rules 数组
    if (schema.rules && schema.rules.length > 0) {
      const error = await executeRules(schema.rules, value, values, label);
      if (error) return error;
    }

    // 3. 自定义 validate 函数
    if (schema.validate) {
      const error = await schema.validate(value, values);
      if (error) return error;
    }

    return undefined;
  }

  /**
   * 验证所有字段
   */
  async validateAll(): Promise<ValidationResult> {
    const errors: Record<string, string> = {};
    const fields = this.formStore.getAllFields();

    for (const [name, field] of fields) {
      if (!field.computedBehavior.visible || field.computedBehavior.disabled) continue;
      const error = await this.validateField(field);
      if (error) errors[name] = error;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  /**
   * 验证指定字段
   */
  async validateFields(fieldNames: string[]): Promise<ValidationResult> {
    const errors: Record<string, string> = {};

    for (const name of fieldNames) {
      const field = this.formStore.getField(name);
      if (!field) continue;
      if (!field.computedBehavior.visible || field.computedBehavior.disabled) continue;
      const error = await this.validateField(field);
      if (error) errors[name] = error;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }
}

/**
 * 创建验证引擎实例
 */
export function createValidationEngine(formStore: FormStoreAPI): ValidationEngine {
  return new ValidationEngine(formStore);
}
