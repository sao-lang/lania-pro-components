/**
 * 枚举映射定义工具
 *
 * 该模块提供了一套完整的枚举映射方案，用于在应用中方便地管理状态-枚举映射关系。
 * 主要应用场景：
 * - Select 下拉选择器的选项渲染
 * - Table 表格中的枚举值 -> 标签文本转换
 * - 表单中的枚举字段绑定
 *
 * 核心设计思路：
 * 1. defineEnumMap 接收一个枚举映射表（键值对），返回一个增强型 Helper 对象
 * 2. Helper 对象内部自动建立双向索引（value<->label），提供高效的查找功能
 * 3. 通过 Proxy 代理，使 Helper 对象同时支持直接属性访问（如 helper.KEY.label）
 * 4. getOptionList 支持缓存机制，相同参数的重复调用直接返回缓存结果
 *
 * @example
 * ```ts
 * const statusMap = defineEnumMap({
 *   ACTIVE: { label: '启用', value: 1 },
 *   INACTIVE: { label: '禁用', value: 0 },
 * });
 *
 * // 获取选项列表（用于 Select 组件）
 * const options = statusMap.getOptionList();
 * // => [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]
 *
 * // 根据值查找标签
 * statusMap.findLabelByValue(1); // => '启用'
 *
 * // 直接属性访问
 * statusMap.ACTIVE.label; // => '启用'
 * ```
 */

// ======================== 类型定义 ========================

/**
 * 枚举项接口
 * 定义单个枚举项的数据结构，支持嵌套子项（用于级联选择等场景）
 */
export interface EnumItem {
  /** 显示文本标签 */
  label: string;
  /** 枚举值，支持字符串或数字类型 */
  value: string | number;
  /** 子选项（用于树形/级联结构） */
  children?: EnumItem[];
  /** 索引签名，允许扩展其他自定义属性 */
  [key: string]: string | number | EnumItem[] | undefined;
}

/**
 * 枚举映射表类型
 * 键为枚举项的唯一标识，值为对应的枚举项
 */
type EnumMap = Record<string, EnumItem>;

/**
 * 构建选项类型（用于 getOptionList 返回值的类型推导）
 * 支持自定义 label 和 value 的字段名
 *
 * @template LK - label 字段名的字符串字面量类型
 * @template VK - value 字段名的字符串字面量类型
 */
type BuildOption<LK extends string, VK extends string> = {
  [K in LK | VK]: string | number;
} & {
  /** 子选项，递归结构 */
  children?: BuildOption<LK, VK>[];
};

// ======================== Helper 类型 ========================

/**
 * 枚举辅助工具类型
 * 通过 defineEnumMap 返回的对象类型，融合了工具方法和原始枚举属性
 *
 * @template T - 原始枚举映射表类型
 */
export type EnumHelper<T extends EnumMap> = {
  // -------- 工具方法 --------

  /**
   * 获取枚举映射表的选项列表
   * 用于 Select、Radio、Checkbox 等组件的选项数据源
   *
   * @param config - 配置项
   * @param config.labelKey - 选项 label 字段名，默认为 'label'
   * @param config.valueKey - 选项 value 字段名，默认为 'value'
   * @param config.prepend - 前置追加的选项列表
   * @param config.append - 后置追加的选项列表
   * @param config.exclude - 需要排除的枚举值列表
   * @returns 格式化后的选项数组（树形结构保留 children）
   *
   * @example
   * // 自定义字段名 + 添加"全部"选项
   * statusMap.getOptionList({
   *   labelKey: 'title',
   *   valueKey: 'id',
   *   prepend: [{ title: '全部', id: -1 }],
   * });
   */
  getOptionList: <LK extends string = 'label', VK extends string = 'value'>(config?: {
    labelKey?: LK;
    valueKey?: VK;
    prepend?: BuildOption<LK, VK>[];
    append?: BuildOption<LK, VK>[];
    exclude?: Array<number | string>;
  }) => BuildOption<LK, VK>[];

  /**
   * 根据枚举值查找对应的标签文本
   * 内部基于 Map 实现 O(1) 查找效率
   *
   * @param value - 枚举值
   * @returns 对应的标签文本，未找到返回 undefined
   */
  findLabelByValue: (value: string | number) => string | undefined;

  /**
   * 根据标签文本查找对应的枚举值
   * 内部基于 Map 实现 O(1) 查找效率
   *
   * @param label - 标签文本
   * @returns 对应的枚举值，未找到返回 undefined
   */
  findValueByLabel: (label: string) => string | number | undefined;

  /**
   * 根据枚举值查找完整的枚举项对象
   *
   * @param value - 枚举值
   * @returns 对应的枚举项对象，未找到返回 undefined
   */
  findItemByValue: (value: string | number) => EnumItem | undefined;

  /**
   * 获取原始的枚举映射表（只读副本）
   *
   * @returns 原始枚举映射表
   */
  getRawMap: () => T;

  /**
   * 判断指定的枚举值是否存在于映射表中
   *
   * @param value - 待判断的枚举值
   * @returns 是否存在
   */
  hasValueKey: (value: string | number) => boolean;

  /**
   * 判断指定的标签文本是否存在于映射表中
   *
   * @param label - 待判断的标签文本
   * @returns 是否存在
   */
  hasLabelText: (label: string) => boolean;

  /**
   * 获取枚举映射表的 [key, item] 键值对数组
   * 等同于 Object.entries(enumMap)
   *
   * @returns 键值对数组
   */
  entries: () => [string, EnumItem][];

  /**
   * 获取枚举映射表的所有键名
   *
   * @returns 键名数组
   */
  keys: () => (keyof T)[];

  /**
   * 获取枚举映射表的所有枚举项
   *
   * @returns 枚举项数组
   */
  values: () => EnumItem[];
} & {
  // -------- 原始枚举属性（通过 Proxy 代理访问） --------
  // 允许通过 helper.ACTIVE 的方式直接访问枚举项
  [K in keyof T]: T[K];
};

// ======================== 核心函数实现 ========================

/**
 * 定义枚举映射表
 *
 * 这是整个模块的核心函数，接收一个枚举映射表并返回增强型 Helper 对象。
 * 内部实现要点：
 * 1. 递归收集所有枚举项（包括 children 中的嵌套项），建立双向索引
 * 2. getOptionList 使用 JSON 序列化缓存键，避免相同参数重复计算
 * 3. 通过 Proxy 代理，使 Helper 支持直接属性访问的同时保留工具方法的调用
 *
 * @param enumMap - 枚举映射表，键为枚举标识，值为枚举项
 * @returns 增强型枚举辅助工具对象
 *
 * @example
 * ```ts
 * const statusMap = defineEnumMap({
 *   ACTIVE: { label: '启用', value: 1, color: 'green' },
 *   INACTIVE: { label: '禁用', value: 0, color: 'red' },
 * });
 *
 * // 作为 Select options
 * <Select options={statusMap.getOptionList()} />
 *
 * // 表格列渲染
 * render: (value) => statusMap.findLabelByValue(value)
 *
 * // 直接访问
 * console.log(statusMap.ACTIVE.label); // '启用'
 * ```
 */
export function defineEnumMap<T extends EnumMap>(enumMap: T): EnumHelper<T> {
  // ===== 初始化双向索引 Map =====
  const labelMap = new Map<string | number, string>(); // value -> label 的映射
  const valueMap = new Map<string, string | number>(); // label -> value 的反向映射
  const valueItemMap = new Map<string | number, EnumItem>(); // value -> 完整枚举项的映射
  const optionsCache = new Map<string, BuildOption<string, string>[]>(); // getOptionList 结果缓存

  /**
   * 递归收集枚举项数据
   * 遍历枚举项及其子项，建立完整的索引映射
   */
  function collect(item: EnumItem) {
    labelMap.set(item.value, item.label);
    valueMap.set(item.label, item.value);
    valueItemMap.set(item.value, item);
    // 递归处理子项（用于级联枚举场景）
    if (item.children) {
      item.children.forEach(collect);
    }
  }

  // 遍历枚举映射表的所有顶级项，开始收集数据
  Object.values(enumMap).forEach(collect);

  // ===== 基础辅助方法对象 =====
  const baseHelper = {
    /**
     * 获取 Select 组件兼容的选项列表
     * 支持自定义字段名、前置/后置选项、排除项和结果缓存
     */
    getOptionList<LK extends string = 'label', VK extends string = 'value'>(config?: {
      labelKey?: LK;
      valueKey?: VK;
      exclude?: Array<string | number>;
      prepend?: BuildOption<LK, VK>[];
      append?: BuildOption<LK, VK>[];
    }): BuildOption<LK, VK>[] {
      // 解构配置项，设置默认值
      const {
        labelKey = 'label' as LK,
        valueKey = 'value' as VK,
        exclude = [],
        prepend = [],
        append = [],
      } = config || {};

      const excludeSet = new Set(exclude);

      // 基于完整配置生成缓存键（使用 JSON 序列化保证唯一性）
      const cacheKey = JSON.stringify({ labelKey, valueKey, exclude });

      // 缓存命中：直接返回缓存的核心数据 + 动态的 prepend/append
      if (optionsCache.has(cacheKey)) {
        const cached = optionsCache.get(cacheKey);
        return [...prepend, ...(cached || []), ...append] as BuildOption<LK, VK>[];
      }

      /**
       * 递归构建选项树
       * 将 EnumItem[] 转换为 { [labelKey]: label, [valueKey]: value, children?: ... } 格式
       *
       * @param items - 枚举项数组
       * @returns 格式化后的选项数组
       */
      function build(items: EnumItem[]): BuildOption<LK, VK>[] {
        return (
          items
            // ⭐ 核心过滤：排除指定的枚举值
            .filter((item) => !excludeSet.has(item.value))
            .map((item) => {
              // 动态构建选项对象，使用自定义的 labelKey 和 valueKey
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              const option = {
                [labelKey]: item.label,
                [valueKey]: item.value,
              } as BuildOption<LK, VK>;

              // 递归处理子项
              if (item.children?.length) {
                const children = build(item.children);
                if (children.length) {
                  option.children = children;
                }
              }

              return option;
            })
        );
      }

      const core = build(Object.values(enumMap));
      // 缓存核心数据（不含 prepend/append，因为它们是动态的）
      optionsCache.set(cacheKey, core);
      return [...prepend, ...core, ...append];
    },

    /** 根据 value 查找 label，O(1) 时间复杂度 */
    findLabelByValue(value: string | number) {
      return labelMap.get(value);
    },

    /** 根据 label 查找 value，O(1) 时间复杂度 */
    findValueByLabel(label: string) {
      return valueMap.get(label);
    },

    /** 根据 value 查找完整枚举项，O(1) 时间复杂度 */
    findItemByValue(value: string | number) {
      return valueItemMap.get(value);
    },

    /** 返回原始枚举映射表的引用（注意是直接引用，不是副本） */
    getRawMap() {
      return enumMap;
    },

    /** 判断指定 value 是否在枚举映射表中 */
    hasValueKey(value: string | number) {
      return labelMap.has(value);
    },

    /** 判断指定 label 是否在枚举映射表中 */
    hasLabelText(label: string) {
      return valueMap.has(label);
    },

    /** 返回枚举映射表的 entries，等同于 Object.entries(enumMap) */
    entries() {
      return Object.entries(enumMap);
    },

    /** 返回枚举映射表的所有键 */
    keys() {
      return Object.keys(enumMap) as (keyof T)[];
    },

    /** 返回枚举映射表的所有值 */
    values() {
      return Object.values(enumMap);
    },
  };

  // ===== Proxy 代理层 =====
  // 通过 Proxy 拦截属性访问：
  // 1. 如果属性存在于 baseHelper 上 → 返回工具方法
  // 2. 如果属性存在于原始 enumMap 上 → 返回对应的枚举项（实现 helper.ACTIVE 直接访问）
  // 3. 否则返回 undefined
  const proxy = new Proxy(baseHelper as EnumHelper<T>, {
    get(target: EnumHelper<T>, prop: string) {
      // 优先返回工具方法
      if (prop in target) {
        return target[prop as keyof EnumHelper<T>];
      }
      // 其次尝试返回原始枚举项
      if (prop in enumMap) {
        return enumMap[prop as keyof T];
      }
      return undefined;
    },
  });

  return proxy;
}
