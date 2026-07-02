/**
 * 对象 / 路径操作工具
 */

/**
 * 深度合并两个对象
 * 递归合并普通对象；数组与 null 源值直接覆盖
 */
export function deepMerge<T, U>(target: T, source: U): T & U {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  Object.keys((source as Record<string, unknown>) || {}).forEach((key) => {
    const sv = (source as Record<string, unknown>)[key];
    const tv = (target as Record<string, unknown>)[key];
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv)) {
      result[key] = deepMerge(
        tv !== null && typeof tv === 'object' ? (tv as Record<string, unknown>) : {},
        sv as Record<string, unknown>,
      );
    } else {
      result[key] = sv;
    }
  });
  return result as T & U;
}

/**
 * 获取嵌套对象的值
 * @param obj 目标对象
 * @param path 点号分隔字符串路径或键数组
 */
export const getNestedValue = (obj: Record<string, unknown>, path: string | string[]): unknown => {
  if (!obj) {
    return undefined;
  }
  const keys = Array.isArray(path) ? path : path.split('.');
  return keys.reduce(
    (acc: unknown, key: string) =>
      acc && typeof acc === 'object' && key in acc ? (acc as Record<string, unknown>)[key] : undefined,
    obj,
  );
};
