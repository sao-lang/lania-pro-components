/**
 * resolveSchemaValue — Schema 函数模式值解析工具
 *
 * 将 ProFormSchema 中支持函数模式的字段在运行时解析为具体值。
 * 若值为函数，则以当前表单值调用它；否则直接返回值本身。
 *
 * @example
 * ```ts
 * // 静态值
 * resolveSchemaValue('用户名', values)        // => '用户名'
 *
 * // 函数值
 * resolveSchemaValue(v => `${v.name}的备注`, { name: '张三' })
 * // => '张三的备注'
 *
 * // undefined + fallback
 * resolveSchemaValue(undefined, values, '--') // => '--'
 * ```
 */

/**
 * 解析可能为函数的 Schema 字段值
 *
 * @param value   静态值或接收表单值的函数
 * @param values  当前表单所有字段的值
 * @param fallback 值为 undefined 时的回退值
 * @returns 解析后的具体值
 */
export function resolveSchemaValue<T>(
  value: T | ((values: Record<string, unknown>) => T) | undefined,
  values: Record<string, unknown>,
  fallback?: T,
): T | undefined {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === 'function') {
    return (value as (values: Record<string, unknown>) => T)(values);
  }
  return value;
}

/**
 * 批量解析 Schema 中多个函数模式字段
 *
 * @param schema  原始 schema 对象（部分字段可能是函数）
 * @param values  当前表单所有字段的值
 * @param keys    需要解析的字段名列表
 * @returns       各字段解析后的具体值
 *
 * @example
 * ```ts
 * const resolved = resolveSchemaFields(schema, values, ['label', 'tooltip', 'col']);
 * // => { label: '用户名', tooltip: '请输入', col: 12 }
 * ```
 */
export function resolveSchemaFields(
  schema: Record<string, unknown>,
  values: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = resolveSchemaValue(schema[key] as unknown, values);
  }
  return result;
}
