/**
 * 规则引擎（ruleEngine）
 *
 * 合并自 ValidationEngine.ts（完整版）和 FormStore.ts（简化版）的验证规则，
 * 作为 ProForm 唯一的规则执行源。
 *
 * 规则清单：
 * - required / min / max / minLength / maxLength / len
 * - precision / step / type / sign / whitespace
 * - pattern / validator
 *
 * 设计原则：
 * - 纯函数：所有校验函数都是纯函数，不依赖 FormStore 实例
 * - 单一来源：所有组件的验证都委托到此引擎
 * - 可测试：每个规则独立可测
 */

import type { ValidationRule } from '../types';

/**
 * 执行单条验证规则
 * @param rule 验证规则
 * @param value 当前值
 * @param values 所有字段值（用于 validator）
 * @param label 字段标签（错误消息中使用）
 * @returns 错误消息，验证通过返回 undefined
 */
export async function executeRule(
  rule: ValidationRule,
  value: unknown,
  values: Record<string, unknown>,
  label?: string,
): Promise<string | undefined> {
  const fieldLabel = label || '此字段';

  // required
  if ('required' in rule && rule.required) {
    const isEmpty =
      value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      return rule.message || `${fieldLabel} 不能为空`;
    }
  }

  // 空值不检查后续规则
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  // min (number)
  if ('min' in rule && typeof value === 'number') {
    if (value < (rule as ValidationRule & { min: number }).min) {
      return rule.message || `最小值为 ${(rule as ValidationRule & { min: number }).min}`;
    }
  }

  // max (number)
  if ('max' in rule && typeof value === 'number') {
    if (value > (rule as ValidationRule & { max: number }).max) {
      return rule.message || `最大值为 ${(rule as ValidationRule & { max: number }).max}`;
    }
  }

  // minLength / maxLength / len
  const { length, isArrayOrString } = getLength(value);
  if (isArrayOrString) {
    if ('minLength' in rule) {
      const minLen = (rule as ValidationRule & { minLength: number }).minLength;
      if (length < minLen) {
        return rule.message || `最少 ${minLen} 个字符`;
      }
    }
    if ('maxLength' in rule) {
      const maxLen = (rule as ValidationRule & { maxLength: number }).maxLength;
      if (length > maxLen) {
        return rule.message || `最多 ${maxLen} 个字符`;
      }
    }
    if ('len' in rule) {
      const exactLen = (rule as ValidationRule & { len: number }).len;
      if (length !== exactLen) {
        return rule.message || `长度必须为 ${exactLen} 个字符`;
      }
    }
  } else {
    // 非字符串/数组，也尝试用 Number 的 len/min/maxLength
    if ('min' in rule && typeof rule.min === 'number') {
      const numVal = Number(value);
      if (!Number.isNaN(numVal) && numVal < rule.min) {
        return rule.message || `最小值为 ${rule.min}`;
      }
    }
    if ('max' in rule && typeof rule.max === 'number') {
      const numVal = Number(value);
      if (!Number.isNaN(numVal) && numVal > rule.max) {
        return rule.message || `最大值为 ${rule.max}`;
      }
    }
  }

  // precision
  if ('precision' in rule && typeof value === 'number') {
    const precision = (rule as ValidationRule & { precision: number }).precision;
    const decimalPart = String(value).split('.')[1];
    const actualPrecision = decimalPart ? decimalPart.length : 0;
    if (actualPrecision > precision) {
      return rule.message || `最多保留 ${precision} 位小数`;
    }
  }

  // step
  if ('step' in rule && typeof value === 'number') {
    const step = (rule as ValidationRule & { step: number }).step;
    if (step > 0) {
      const remainder = value % step;
      if (Math.abs(remainder) > Number.EPSILON) {
        return rule.message || `值必须是 ${step} 的倍数`;
      }
    }
  }

  // type
  if ('type' in rule) {
    const type = (rule as ValidationRule & { type: 'number' | 'integer' | 'float' | 'string' | 'boolean' }).type;
    let isValid = false;
    switch (type) {
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
      return rule.message || `值类型必须为 ${type}`;
    }
  }

  // sign
  if ('sign' in rule && typeof value === 'number' && !Number.isNaN(value)) {
    const sign = (rule as ValidationRule & { sign: 'positive' | 'negative' | 'zero' }).sign;
    let isValid = false;
    switch (sign) {
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
      const labels: Record<string, string> = { positive: '正数', negative: '负数', zero: '零' };
      return rule.message || `值必须为${labels[sign]}`;
    }
  }

  // whitespace
  if ('whitespace' in rule && rule.whitespace) {
    if (typeof value === 'string' && value.trim() === '') {
      return rule.message || '不允许输入空白字符';
    }
  }

  // pattern
  if ('pattern' in rule && rule.pattern) {
    const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
    let valueStr: string;
    if (typeof value === 'string') {
      valueStr = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      valueStr = String(value);
    } else {
      return rule.message || '格式不正确';
    }
    if (!pattern.test(valueStr)) {
      return rule.message || '格式不正确';
    }
  }

  // validator
  if ('validator' in rule && rule.validator) {
    try {
      const result = await rule.validator(value, values);
      if (result !== undefined) {
        return typeof result === 'string' ? result : rule.message || `${fieldLabel} 验证失败`;
      }
    } catch {
      return rule.message || `${fieldLabel} 验证失败`;
    }
  }

  return undefined;
}

/**
 * 批量执行多条验证规则
 */
export async function executeRules(
  rules: ValidationRule[],
  value: unknown,
  values: Record<string, unknown>,
  label?: string,
): Promise<string | undefined> {
  for (const rule of rules) {
    const error = await executeRule(rule, value, values, label);
    if (error) {
      return error;
    }
  }
  return undefined;
}

/**
 * 获取值的长度（兼容字符串和数组）
 */
function getLength(value: unknown): { length: number; isArrayOrString: boolean } {
  if (Array.isArray(value)) return { length: value.length, isArrayOrString: true };
  if (typeof value === 'string') return { length: value.length, isArrayOrString: true };
  if (typeof value === 'number' || typeof value === 'boolean') {
    return { length: String(value).length, isArrayOrString: true };
  }
  return { length: 0, isArrayOrString: false };
}
