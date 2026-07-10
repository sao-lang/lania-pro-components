/**
 * @lania-pro-components/shared
 *
 * usePresetManager — 预设管理 Hook
 *
 * 泛化自 ProTable/hooks/useSearchSchema.ts。
 * 提供通用的"预设 CRUD + localStorage 持久化"能力，
 * 适用于查询方案、表单模板、筛选预设等场景。
 *
 * @example
 * ```tsx
 * const { presets, current, save, remove, rename, apply } = usePresetManager({
 *   persistenceKey: 'my-search-schemas',
 *   maxCount: 10,
 * });
 *
 * save('我的方案', { keyword: 'test', status: 1 });
 * apply(savedPreset.key);
 * ```
 */
import { useState, useCallback, useRef } from 'react';

/**
 * 预设项
 */
export interface PresetItem<TParams = Record<string, unknown>> {
  /** 唯一标识 */
  key: string;
  /** 名称 */
  name: string;
  /** 参数 */
  params: TParams;
  /** 创建时间 */
  createdAt?: number;
}

/**
 * usePresetManager 配置
 */
export interface UsePresetManagerOptions<TParams = Record<string, unknown>> {
  /** 是否启用 */
  enabled?: boolean;
  /** localStorage 持久化 key（不设置则不持久化） */
  persistenceKey?: string;
  /** 默认选中项 key */
  defaultPreset?: string;
  /** 预设方案列表 */
  presets?: PresetItem<TParams>[];
  /** 最大保存数量 */
  maxCount?: number;
}

/**
 * usePresetManager 返回值
 */
export interface UsePresetManagerReturn<TParams = Record<string, unknown>> {
  /** 预设列表 */
  presets: PresetItem<TParams>[];
  /** 当前选中 key */
  current: string | undefined;
  /** 保存预设 */
  save: (name: string, params: TParams) => void;
  /** 切换预设 */
  apply: (key: string) => void;
  /** 删除预设 */
  remove: (key: string) => void;
  /** 重命名预设 */
  rename: (key: string, newName: string) => void;
  /** 更新预设参数 */
  update: (key: string, params: TParams) => void;
  /** 获取预设参数 */
  getParams: (key: string) => TParams | undefined;
}

const STORAGE_PREFIX = 'lania-pro-preset-';

/**
 * 从 localStorage 读取预设列表
 *
 * @param key - 持久化 key（不含前缀）
 * @returns 预设数组，读取失败返回空数组
 */
function loadFromStorage<TParams>(key: string): PresetItem<TParams>[] {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 将预设列表写入 localStorage
 *
 * @param key - 持久化 key（不含前缀）
 * @param items - 预设数组
 */
function saveToStorage<TParams>(key: string, items: PresetItem<TParams>[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

/**
 * 生成预设唯一 key
 *
 * 格式：preset-{时间戳}-{9位随机串}，保证全局唯一性。
 */
function generateKey(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 预设管理 Hook
 */
export function usePresetManager<TParams = Record<string, unknown>>(
  options: UsePresetManagerOptions<TParams> = {},
): UsePresetManagerReturn<TParams> {
  const { enabled = true, persistenceKey, defaultPreset, presets: presetList = [], maxCount = 10 } = options;

  const [presets, setPresets] = useState<PresetItem<TParams>[]>(() => {
    if (!enabled) return [];
    const stored = persistenceKey ? loadFromStorage<TParams>(persistenceKey) : [];
    return [...presetList, ...stored];
  });

  const [current, setCurrent] = useState<string | undefined>(defaultPreset);
  const maxCountRef = useRef(maxCount);

  /**
   * 持久化用户预设到 localStorage
   *
   * 仅持久化用户创建的预设，内置 presetList 不写入存储。
   */
  const persist = useCallback(
    (items: PresetItem<TParams>[]) => {
      if (persistenceKey) {
        const presetKeys = new Set(presetList.map((p) => p.key));
        const userOnly = items.filter((p) => !presetKeys.has(p.key));
        saveToStorage(persistenceKey, userOnly);
      }
    },
    [persistenceKey, presetList],
  );

  /**
   * 保存新预设
   *
   * 生成唯一 key，加入列表；若超过 maxCount 则按 FIFO 淘汰最早的用户预设。
   * 保存后自动选中新预设。
   */
  const save = useCallback(
    (name: string, params: TParams) => {
      if (!enabled) return;
      const newItem: PresetItem<TParams> = {
        key: generateKey(),
        name,
        params: { ...params },
        createdAt: Date.now(),
      };
      setPresets((prev) => {
        const next = [...prev, newItem];
        if (next.length > maxCountRef.current) {
          // 仅淘汰用户预设，按创建时间 FIFO 移除最早项
          const presetKeys = new Set(presetList.map((p) => p.key));
          const userItems = next.filter((p) => !presetKeys.has(p.key));
          const toRemove = userItems.slice(0, userItems.length - maxCountRef.current);
          const toRemoveKeys = new Set(toRemove.map((p) => p.key));
          const filtered = next.filter((p) => !toRemoveKeys.has(p.key));
          persist(filtered);
          return filtered;
        }
        persist(next);
        return next;
      });
      setCurrent(newItem.key);
    },
    [enabled, presetList, persist],
  );

  /**
   * 切换到指定预设
   *
   * @param key - 预设 key，必须存在才会切换
   */
  const apply = useCallback(
    (key: string) => {
      if (!enabled) return;
      if (presets.some((p) => p.key === key)) {
        setCurrent(key);
      }
    },
    [enabled, presets],
  );

  /**
   * 删除指定预设
   *
   * 从列表移除并持久化；若删除的是当前选中项，则清空 current。
   */
  const remove = useCallback(
    (key: string) => {
      if (!enabled) return;
      setPresets((prev) => {
        const next = prev.filter((p) => p.key !== key);
        persist(next);
        return next;
      });
      if (current === key) setCurrent(undefined);
    },
    [enabled, current, persist],
  );

  /**
   * 重命名指定预设
   */
  const rename = useCallback(
    (key: string, newName: string) => {
      if (!enabled) return;
      setPresets((prev) => {
        const next = prev.map((p) => (p.key === key ? { ...p, name: newName } : p));
        persist(next);
        return next;
      });
    },
    [enabled, persist],
  );

  /**
   * 更新指定预设的参数（整体替换，非合并）
   */
  const update = useCallback(
    (key: string, params: TParams) => {
      if (!enabled) return;
      setPresets((prev) => {
        const next = prev.map((p) => (p.key === key ? { ...p, params: { ...params } } : p));
        persist(next);
        return next;
      });
    },
    [enabled, persist],
  );

  /**
   * 获取指定预设的参数
   *
   * @returns 预设参数，不存在返回 undefined
   */
  const getParams = useCallback(
    (key: string): TParams | undefined => {
      return presets.find((p) => p.key === key)?.params;
    },
    [presets],
  );

  return {
    presets,
    current,
    save,
    apply: apply as UsePresetManagerReturn<TParams>['apply'],
    remove,
    rename,
    update,
    getParams,
  };
}
