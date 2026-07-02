import type { FieldNodeAPI, FormStoreAPI, ValidationRule, ValidationResult } from '../types';

/**
 * 验证引擎
 * 集中管理表单验证逻辑
 */
export class ValidationEngine {
  private formStore: FormStoreAPI;

  constructor(formStore: FormStoreAPI) {
    this.formStore = formStore;
  }

  /**
   * 验证单个字段
   * @param field 字段实例
   * @returns 错误信息，验证通过返回 undefined
   */
  async validateField(field: FieldNodeAPI): Promise<string | undefined> {
    const { schema, value } = field;
    const values = this.formStore.getValues();

    // 1. 检查 required
    if (schema.required) {
      const error = this.checkRequired(value, schema.requiredMessage);
      if (error) {
        return error;
      }
    }

    // 2. 检查 rules
    if (schema.rules && schema.rules.length > 0) {
      for (const rule of schema.rules) {
        const error = await this.checkRule(value, rule, values);
        if (error) {
          return error;
        }
      }
    }

    // 3. 执行自定义验证
    if (schema.validate) {
      const error = await schema.validate(value, values);
      if (error) {
        return error;
      }
    }

    return undefined;
  }

  /**
   * 验证所有字段
   * @returns 验证结果
   */
  async validateAll(): Promise<ValidationResult> {
    const errors: Record<string, string> = {};
    const fields = this.formStore.getAllFields();

    for (const [name, field] of fields) {
      // 跳过不可见或禁用的字段
      if (!field.computedBehavior.visible || field.computedBehavior.disabled) {
        continue;
      }

      const error = await this.validateField(field);
      if (error) {
        errors[name] = error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * 验证指定字段
   * @param fieldNames 字段名数组
   * @returns 验证结果
   */
  async validateFields(fieldNames: string[]): Promise<ValidationResult> {
    const errors: Record<string, string> = {};

    for (const name of fieldNames) {
      const field = this.formStore.getField(name);
      if (!field) {
        continue;
      }

      // 跳过不可见或禁用的字段
      if (!field.computedBehavior.visible || field.computedBehavior.disabled) {
        continue;
      }

      const error = await this.validateField(field);
      if (error) {
        errors[name] = error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * 检查必填
   */
  private checkRequired(value: unknown, message?: string): string | undefined {
    const isEmpty =
      value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      return message || '此字段为必填项';
    }
    return undefined;
  }

  /**
   * 检查规则
   */
  private async checkRule(
    value: unknown,
    rule: ValidationRule,
    values: Record<string, unknown>,
  ): Promise<string | undefined> {
    // required
    if ('required' in rule && rule.required) {
      const { message } = rule as { required: true; message?: string };
      return this.checkRequired(value, message);
    }

    // 空值不检查其他规则
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    // min (for number)
    if ('min' in rule && typeof value === 'number') {
      const minRule = rule as { min: number; message?: string };
      if (value < minRule.min) {
        return minRule.message || `最小值为 ${minRule.min}`;
      }
    }

    // max (for number)
    if ('max' in rule && typeof value === 'number') {
      const maxRule = rule as { max: number; message?: string };
      if (value > maxRule.max) {
        return maxRule.message || `最大值为 ${maxRule.max}`;
      }
    }

    // minLength
    if ('minLength' in rule) {
      const minLengthRule = rule as { minLength: number; message?: string };
      let length: number;
      if (Array.isArray(value)) {
        length = value.length;
      } else if (typeof value === 'string') {
        length = value.length;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        length = String(value).length;
      } else {
        length = 0;
      }
      if (length < minLengthRule.minLength) {
        return minLengthRule.message || `最少 ${minLengthRule.minLength} 个字符`;
      }
    }

    // maxLength
    if ('maxLength' in rule) {
      const maxLengthRule = rule as { maxLength: number; message?: string };
      let length: number;
      if (Array.isArray(value)) {
        length = value.length;
      } else if (typeof value === 'string') {
        length = value.length;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        length = String(value).length;
      } else {
        length = 0;
      }
      if (length > maxLengthRule.maxLength) {
        return maxLengthRule.message || `最多 ${maxLengthRule.maxLength} 个字符`;
      }
    }

    // len
    if ('len' in rule) {
      const lenRule = rule as { len: number; message?: string };
      let length: number;
      if (Array.isArray(value)) {
        length = value.length;
      } else if (typeof value === 'string') {
        length = value.length;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        length = String(value).length;
      } else {
        length = 0;
      }
      if (length !== lenRule.len) {
        return lenRule.message || `长度必须为 ${lenRule.len} 个字符`;
      }
    }

    // precision
    if ('precision' in rule && typeof value === 'number') {
      const precisionRule = rule as { precision: number; message?: string };
      const decimalPart = String(value).split('.')[1];
      const actualPrecision = decimalPart ? decimalPart.length : 0;
      if (actualPrecision > precisionRule.precision) {
        return precisionRule.message || `最多保留 ${precisionRule.precision} 位小数`;
      }
    }

    // step
    if ('step' in rule && typeof value === 'number') {
      const stepRule = rule as { step: number; message?: string };
      if (stepRule.step > 0) {
        const remainder = value % stepRule.step;
        if (Math.abs(remainder) > Number.EPSILON) {
          return stepRule.message || `值必须是 ${stepRule.step} 的倍数`;
        }
      }
    }

    // type
    if ('type' in rule) {
      const typeRule = rule as { type: 'number' | 'integer' | 'float' | 'string' | 'boolean'; message?: string };
      let isValid = false;
      switch (typeRule.type) {
        case 'number':
          isValid = typeof value === 'number' && !Number.isNaN(value);
          break;
        case 'integer':
          isValid = Number.isInteger(value);
          break;
        case 'float':
          isValid = typeof value === 'number' && !Number.isNaN(value) && !Number.isInteger(value);
          break;
        case 'string':
          isValid = typeof value === 'string';
          break;
        case 'boolean':
          isValid = typeof value === 'boolean';
          break;
      }
      if (!isValid) {
        return typeRule.message || `值类型必须为 ${typeRule.type}`;
      }
    }

    // sign
    if ('sign' in rule && typeof value === 'number' && !Number.isNaN(value)) {
      const signRule = rule as { sign: 'positive' | 'negative' | 'zero'; message?: string };
      let isValid = false;
      switch (signRule.sign) {
        case 'positive':
          isValid = value > 0;
          break;
        case 'negative':
          isValid = value < 0;
          break;
        case 'zero':
          isValid = value === 0;
          break;
      }
      if (!isValid) {
        const signLabels: Record<string, string> = {
          positive: '正数',
          negative: '负数',
          zero: '零',
        };
        return signRule.message || `值必须为${signLabels[signRule.sign]}`;
      }
    }

    // whitespace
    if ('whitespace' in rule && rule.whitespace) {
      const whitespaceRule = rule as { whitespace: boolean; message?: string };
      if (typeof value === 'string' && value.trim() === '') {
        return whitespaceRule.message || '不允许输入空白字符';
      }
    }

    // pattern
    if ('pattern' in rule) {
      const patternRule = rule as { pattern: RegExp; message?: string };
      let valueStr: string;
      if (typeof value === 'string') {
        valueStr = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        valueStr = String(value);
      } else {
        return patternRule.message || '格式不正确';
      }
      if (!patternRule.pattern.test(valueStr)) {
        return patternRule.message || '格式不正确';
      }
    }

    // validator
    if ('validator' in rule) {
      const validatorRule = rule as {
        validator: (
          value: unknown,
          values: Record<string, unknown>,
        ) => string | undefined | Promise<string | undefined>;
        message?: string;
      };
      const result = await validatorRule.validator(value, values);
      if (result) {
        return result;
      }
    }

    return undefined;
  }
}

/**
 * 创建验证引擎实例
 */
export function createValidationEngine(formStore: FormStoreAPI): ValidationEngine {
  return new ValidationEngine(formStore);
}
