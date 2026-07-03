/**
 * 对象与路径操作工具模块
 *
 * 提供对象深度合并和嵌套属性访问的工具函数。
 * 这些函数在表单数据处理、配置合并、状态管理等场景中频繁使用。
 */

/**
 * 深度合并两个对象
 *
 * 递归地将 source 对象的属性合并到 target 对象中，返回一个全新的合并结果。
 * 合并规则：
 * - 普通对象属性：递归合并（嵌套对象的属性会逐层合并）
 * - 数组属性：直接覆盖（不进行数组合并）
 * - null 或非对象属性（基本类型）：直接覆盖
 *
 * 注意：源对象中值为 null 的属性会直接覆盖目标对象的对应属性。
 *
 * @param target - 目标对象（提供默认值）
 * @param source - 源对象（提供覆盖值）
 * @returns 合并后的新对象，类型为 T & U 的交叉类型
 *
 * @template T - 目标对象类型
 * @template U - 源对象类型
 *
 * @example
 * ```ts
 * const defaults = { a: 1, b: { c: 2, d: 3 } };
 * const overrides = { b: { c: 99 }, e: 4 };
 * const result = deepMerge(defaults, overrides);
 * // result = { a: 1, b: { c: 99, d: 3 }, e: 4 }
 * // 数组直接覆盖，不合并
 * const arr1 = { items: [1, 2] };
 * const arr2 = { items: [3] };
 * deepMerge(arr1, arr2); // { items: [3] }
 * ```
 */
export function deepMerge<T, U>(target: T, source: U): T & U {
  // 浅克隆 target，避免修改原对象
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  Object.keys((source as Record<string, unknown>) || {}).forEach((key) => {
    const sv = (source as Record<string, unknown>)[key]; // source 中对应 key 的值
    const tv = (target as Record<string, unknown>)[key]; // target 中对应 key 的值

    // 判断是否需要递归合并：
    // 1. source 的值不是 null
    // 2. source 的值是对象类型（typeof === 'object'）
    // 3. source 的值不是数组（数组直接覆盖）
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv)) {
      result[key] = deepMerge(
        tv !== null && typeof tv === 'object' ? (tv as Record<string, unknown>) : {},
        sv as Record<string, unknown>,
      );
    } else {
      // 基本类型、数组、null → 直接覆盖
      result[key] = sv;
    }
  });

  return result as T & U;
}

/**
 * 获取嵌套对象中的深层属性值
 *
 * 通过点号分隔的路径字符串或路径数组，安全地访问嵌套对象的深层属性。
 * 在路径中任意一层为 undefined 或 null 时，不会抛出异常，而是返回 undefined。
 *
 * 典型应用场景：
 * - 安全访问 API 响应中的深层字段
 * - 表单数据中嵌套字段的提取
 * - 配置对象中的深层属性读取
 *
 * @param obj - 目标对象
 * @param path - 属性路径，支持两种格式：
 *   - 字符串（点号分隔）：'a.b.c' 表示 obj.a.b.c
 *   - 字符串数组：['a', 'b', 'c'] 表示 obj['a']['b']['c']
 * @returns 路径指向的属性值；如果任意中间层不存在则返回 undefined
 *
 * @example
 * ```ts
 * const obj = { user: { profile: { name: 'Alice', age: 30 } } };
 *
 * getNestedValue(obj, 'user.profile.name');  // 'Alice'
 * getNestedValue(obj, ['user', 'profile', 'age']); // 30
 * getNestedValue(obj, 'user.profile.email'); // undefined（路径不存在）
 * getNestedValue(null, 'a.b');               // undefined（obj 为空）
 * ```
 */
export const getNestedValue = (obj: Record<string, unknown>, path: string | string[]): unknown => {
  // 空对象防护
  if (!obj) {
    return undefined;
  }

  // 统一为数组格式：字符串路径按 '.' 分割，数组路径直接使用
  const keys = Array.isArray(path) ? path : path.split('.');

  // 使用 reduce 逐层取值：
  // 1. 初始值为 obj
  // 2. 每一步检查当前值是否为对象、是否包含目标 key
  // 3. 如果存在则取下一层，否则返回 undefined（短路，后续层级不再访问）
  return keys.reduce(
    (acc: unknown, key: string) =>
      acc && typeof acc === 'object' && key in acc ? (acc as Record<string, unknown>)[key] : undefined,
    obj,
  );
};
