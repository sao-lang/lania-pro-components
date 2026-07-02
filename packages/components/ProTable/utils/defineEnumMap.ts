export interface EnumItem {
  label: string;
  value: string | number;
  children?: EnumItem[];
  [key: string]: any;
}

type EnumMap = Record<string, EnumItem>;

type BuildOption<LK extends string, VK extends string> = {
  [K in LK | VK]: string | number;
} & {
  children?: BuildOption<LK, VK>[];
};

export type EnumHelper<T extends EnumMap> = {
  /**
   * @description 获取枚举映射表的选项列表，用于Select组件的选项
   * @param config 配置项
   * @returns 选项列表
   */
  getOptionList: <LK extends string = 'label', VK extends string = 'value'>(config?: {
    labelKey?: LK;
    valueKey?: VK;
    prepend?: BuildOption<LK, VK>[];
    append?: BuildOption<LK, VK>[];
    exclude?: Array<number | string>;
  }) => BuildOption<LK, VK>[];
  /**
   * @description 根据值查找标签
   * @param value 值
   * @returns 标签
   */
  findLabelByValue: (value: string | number) => string | undefined;
  /**
   * @description 根据标签查找值
   * @param label 标签
   * @returns 值
   */
  findValueByLabel: (label: string) => string | number | undefined;
  /**
   * @description 根据值查找枚举项
   * @param value 值
   * @returns 枚举项
   */
  findItemByValue: (value: string | number) => EnumItem | undefined;
  /**
   * @description 获取原始枚举映射表
   * @returns 原始枚举映射表
   */
  getRawMap: () => T;
  /**
   * @description 判断值是否存在于枚举映射表中
   * @param value 值
   * @returns 是否存在
   */
  hasValueKey: (value: string | number) => boolean;
  /**
   * @description 判断标签是否存在于枚举映射表中
   * @param label 标签
   * @returns 是否存在
   */
  hasLabelText: (label: string) => boolean;
  /**
   * @description 获取枚举映射表的键值对数组
   * @returns 键值对数组
   */
  entries: () => [string, EnumItem][];
  /**
   * @description 获取枚举映射表的键数组
   * @returns 键数组
   */
  keys: () => (keyof T)[];
  /**
   * @description 获取枚举映射表的值数组
   * @returns 值数组
   */
  values: () => EnumItem[];
} & {
  [K in keyof T]: T[K];
};

/**
 * @description 方便使用状态到枚举的映射，在Select和Table渲染中使用
 * @param enumMap 枚举映射表
 */
export function defineEnumMap<T extends EnumMap>(enumMap: T): EnumHelper<T> {
  const labelMap = new Map<string | number, string>();
  const valueMap = new Map<string, string | number>();
  const valueItemMap = new Map<string | number, EnumItem>();
  const optionsCache = new Map<string, BuildOption<string, string>[]>();
  function collect(item: EnumItem) {
    labelMap.set(item.value, item.label);
    valueMap.set(item.label, item.value);
    valueItemMap.set(item.value, item);
    if (item.children) {
      item.children.forEach(collect);
    }
  }
  Object.values(enumMap).forEach(collect);
  const baseHelper = {
    getOptionList<LK extends string = 'label', VK extends string = 'value'>(config?: {
      labelKey?: LK;
      valueKey?: VK;
      exclude?: Array<string | number>;
      prepend?: BuildOption<LK, VK>[];
      append?: BuildOption<LK, VK>[];
    }): BuildOption<LK, VK>[] {
      const {
        labelKey = 'label' as LK,
        valueKey = 'value' as VK,
        exclude = [],
        prepend = [],
        append = [],
      } = config || {};
      const excludeSet = new Set(exclude);
      const cacheKey = JSON.stringify({ labelKey, valueKey, exclude });
      if (optionsCache.has(cacheKey)) {
        return [...prepend, ...optionsCache.get(cacheKey)!, ...append] as BuildOption<LK, VK>[];
      }
      function build(items: EnumItem[]): BuildOption<LK, VK>[] {
        return items
          .filter((item) => !excludeSet.has(item.value)) // ⭐ 核心过滤
          .map((item) => {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const option = {
              [labelKey]: item.label,
              [valueKey]: item.value,
            } as BuildOption<LK, VK>;

            if (item.children?.length) {
              const children = build(item.children);
              if (children.length) {
                option.children = children;
              }
            }

            return option;
          });
      }
      const core = build(Object.values(enumMap));
      optionsCache.set(cacheKey, core);
      return [...prepend, ...core, ...append];
    },
    findLabelByValue(value: string | number) {
      return labelMap.get(value);
    },
    findValueByLabel(label: string) {
      return valueMap.get(label);
    },
    findItemByValue(value: string | number) {
      return valueItemMap.get(value);
    },
    getRawMap() {
      return enumMap;
    },
    hasValueKey(value: string | number) {
      return labelMap.has(value);
    },
    hasLabelText(label: string) {
      return valueMap.has(label);
    },
    entries() {
      return Object.entries(enumMap);
    },
    keys() {
      return Object.keys(enumMap) as (keyof T)[];
    },
    values() {
      return Object.values(enumMap);
    },
  };

  // 加 Proxy，支持 enumHelper.xxx 访问对应项
  const proxy = new Proxy(baseHelper as EnumHelper<T>, {
    get(target, prop: string) {
      if (prop in target) {
        return (target as any)[prop];
      }
      if (prop in enumMap) {
        return enumMap[prop as keyof T];
      }
      return undefined;
    },
  });

  return proxy;
}
