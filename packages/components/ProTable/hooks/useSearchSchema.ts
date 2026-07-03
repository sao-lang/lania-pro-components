/**
 * 搜索方案管理 Hook（useSearchSchema）
 *
 * 为 ProTable 的查询表单提供"保存/切换查询方案"功能：
 * - 保存当前查询条件为方案
 * - 切换不同方案（自动应用方案参数）
 * - 删除/重命名方案
 * - 方案持久化（localStorage）
 */
/**
 * 搜索方案管理 Hook（useSearchSchema）
 *
 * 为 ProTable 查询表单提供"保存/切换查询方案"功能：
 * - 保存当前查询条件为方案（命名 + 持久化）
 * - 切换不同方案时自动应用方案中的参数到 DataStore
 * - 删除/重命名已有方案
 * - 方案持久化（localStorage），刷新后自动恢复
 *
 * 使用场景：用户在不同查询条件间快速切换，无需每次手动输入。
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export interface SearchSchema {
  /** 方案唯一标识 */
  key: string;
  /** 方案名称 */
  name: string;
  /** 查询参数 */
  params: Record<string, unknown>;
  /** 创建时间 */
  createdAt?: number;
}

export interface SearchSchemaConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 持久化存储的 key */
  persistenceKey?: string;
  /** 默认选中的方案 */
  defaultSchema?: string;
  /** 预设方案列表 */
  schemas?: SearchSchema[];
  /** 最大保存数量 */
  maxCount?: number;
}

export interface UseSearchSchemaOptions {
  /** 是否启用 */
  enabled: boolean;
  /** 持久化 key */
  persistenceKey?: string;
  /** 默认方案 */
  defaultSchema?: string;
  /** 初始方案列表 */
  initialSchemas?: SearchSchema[];
}

export interface UseSearchSchemaReturn {
  /** 方案列表 */
  schemas: SearchSchema[];
  /** 当前选中的方案 */
  currentSchema: string | undefined;
  /** 保存方案 */
  saveSchema: (name: string, params?: Record<string, unknown>) => void;
  /** 切换方案 */
  switchSchema: (key: string) => void;
  /** 删除方案 */
  deleteSchema: (key: string) => void;
  /** 重命名方案 */
  renameSchema: (key: string, newName: string) => void;
  /** 更新方案 */
  updateSchema: (key: string, params: Record<string, unknown>) => void;
}

const STORAGE_KEY_PREFIX = 'pro-table-n-search-schema-';

/**
 * 从 localStorage 加载方案列表
 */
const loadSchemasFromStorage = (persistenceKey: string): SearchSchema[] => {
  try {
    const key = STORAGE_KEY_PREFIX + persistenceKey;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as SearchSchema[];
    }
  } catch {
    // 忽略解析错误
  }
  return [];
};

/**
 * 保存方案列表到 localStorage
 */
const saveSchemasToStorage = (persistenceKey: string, schemas: SearchSchema[]) => {
  try {
    const key = STORAGE_KEY_PREFIX + persistenceKey;
    localStorage.setItem(key, JSON.stringify(schemas));
  } catch {
    // 忽略存储错误
  }
};

/**
 * 生成唯一 key
 */
const generateKey = () => `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * 查询方案 Hook
 */
export const useSearchSchema = (options: UseSearchSchemaOptions): UseSearchSchemaReturn => {
  const { enabled, persistenceKey, defaultSchema, initialSchemas: presetSchemas = [] } = options;
  const maxCount = 10;

  const [schemas, setSchemas] = useState<SearchSchema[]>(() => {
    if (!enabled) {
      return [];
    }

    // 合并预设方案和持久化方案
    const storedSchemas = persistenceKey ? loadSchemasFromStorage(persistenceKey) : [];
    return [...presetSchemas, ...storedSchemas];
  });

  const [currentSchema, setCurrentSchema] = useState<string | undefined>(defaultSchema);
  const initializedRef = useRef(false);

  /**
   * 保存方案
   */
  const saveSchema = useCallback(
    (name: string, params?: Record<string, unknown>) => {
      if (!enabled) {
        return;
      }

      const schemaParams = params || {};

      const newSchema: SearchSchema = {
        key: generateKey(),
        name,
        params: { ...schemaParams },
        createdAt: Date.now(),
      };

      setSchemas((prev) => {
        // 检查是否超过最大数量
        const newSchemas = [...prev, newSchema];
        if (newSchemas.length > maxCount) {
          // 删除最旧的方案（保留预设方案）
          const userSchemas = newSchemas.filter((s) => !presetSchemas.find((p) => p.key === s.key));
          const schemasToRemove = userSchemas.slice(0, userSchemas.length - maxCount);
          const filtered = newSchemas.filter((s) => !schemasToRemove.find((r) => r.key === s.key));

          // 持久化
          if (persistenceKey) {
            const userOnly = filtered.filter((s) => !presetSchemas.find((p) => p.key === s.key));
            saveSchemasToStorage(persistenceKey, userOnly);
          }

          return filtered;
        }

        // 持久化
        if (persistenceKey) {
          const userOnly = newSchemas.filter((s) => !presetSchemas.find((p) => p.key === s.key));
          saveSchemasToStorage(persistenceKey, userOnly);
        }

        return newSchemas;
      });

      // 自动切换到新方案
      setCurrentSchema(newSchema.key);
    },
    [enabled, persistenceKey, presetSchemas, maxCount],
  );

  /**
   * 切换方案
   */
  const switchSchema = useCallback(
    (key: string) => {
      if (!enabled) {
        return;
      }

      const schema = schemas.find((s) => s.key === key);
      if (schema) {
        setCurrentSchema(key);
      }
    },
    [enabled, schemas],
  );

  /**
   * 删除方案
   */
  const deleteSchema = useCallback(
    (key: string) => {
      if (!enabled) {
        return;
      }

      setSchemas((prev) => {
        const newSchemas = prev.filter((s) => s.key !== key);

        // 持久化
        if (persistenceKey) {
          const userOnly = newSchemas.filter((s) => !presetSchemas.find((p) => p.key === s.key));
          saveSchemasToStorage(persistenceKey, userOnly);
        }

        return newSchemas;
      });

      // 如果删除的是当前选中的方案，清空当前选中
      if (currentSchema === key) {
        setCurrentSchema(undefined);
      }
    },
    [enabled, persistenceKey, presetSchemas, currentSchema],
  );

  /**
   * 重命名方案
   */
  const renameSchema = useCallback(
    (key: string, newName: string) => {
      if (!enabled) {
        return;
      }

      setSchemas((prev) => {
        const newSchemas = prev.map((s) => (s.key === key ? { ...s, name: newName } : s));

        // 持久化
        if (persistenceKey) {
          const userOnly = newSchemas.filter((s) => !presetSchemas.find((p) => p.key === s.key));
          saveSchemasToStorage(persistenceKey, userOnly);
        }

        return newSchemas;
      });
    },
    [enabled, persistenceKey, presetSchemas],
  );

  /**
   * 更新方案
   */
  const updateSchema = useCallback(
    (key: string, params: Record<string, unknown>) => {
      if (!enabled) {
        return;
      }

      setSchemas((prev) => {
        const newSchemas = prev.map((s) => (s.key === key ? { ...s, params: { ...params } } : s));

        // 持久化
        if (persistenceKey) {
          const userOnly = newSchemas.filter((s) => !presetSchemas.find((p) => p.key === s.key));
          saveSchemasToStorage(persistenceKey, userOnly);
        }

        return newSchemas;
      });
    },
    [enabled, persistenceKey, presetSchemas],
  );

  // 初始加载时应用默认方案
  useEffect(() => {
    if (!enabled || initializedRef.current) {
      return;
    }

    if (defaultSchema) {
      const schema = schemas.find((s) => s.key === defaultSchema);
      if (schema) {
        setCurrentSchema(defaultSchema);
      }
    }

    initializedRef.current = true;
  }, [enabled, defaultSchema, schemas]);

  return {
    schemas,
    currentSchema,
    saveSchema,
    switchSchema,
    deleteSchema,
    renameSchema,
    updateSchema,
  };
};

export default useSearchSchema;
