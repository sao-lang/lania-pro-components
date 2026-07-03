/**
 * 搜索方案管理 Hook（useSearchSchema）
 *
 * @deprecated 请从 @lania-pro-components/shared 导入 usePresetManager
 * 此文件为向后兼容保留的适配壳
 */
import { usePresetManager } from '@lania-pro-components/shared';
import type { PresetItem } from '@lania-pro-components/shared';

export type SearchSchema = PresetItem<Record<string, unknown>>;

export interface SearchSchemaConfig {
  enabled?: boolean;
  persistenceKey?: string;
  defaultSchema?: string;
  schemas?: SearchSchema[];
  initialSchemas?: SearchSchema[];
  maxCount?: number;
}

export type UseSearchSchemaOptions = SearchSchemaConfig;
export interface UseSearchSchemaReturn {
  schemas: SearchSchema[];
  currentSchema: string | undefined;
  saveSchema: (name: string, params?: Record<string, unknown>) => void;
  switchSchema: (key: string) => void;
  deleteSchema: (key: string) => void;
  renameSchema: (key: string, newName: string) => void;
  updateSchema: (key: string, params: Record<string, unknown>) => void;
}

export function useSearchSchema(options: UseSearchSchemaOptions): UseSearchSchemaReturn {
  // 映射旧版字段名到新版
  const { defaultSchema, schemas, initialSchemas, ...rest } = options;
  const mgr = usePresetManager<Record<string, unknown>>({
    ...rest,
    defaultPreset: defaultSchema,
    presets: initialSchemas ?? schemas,
  });
  return {
    schemas: mgr.presets,
    currentSchema: mgr.current,
    saveSchema: (name, params) => mgr.save(name, params ?? {}),
    switchSchema: (key) => mgr.apply(key),
    deleteSchema: (key) => mgr.remove(key),
    renameSchema: (key, newName) => mgr.rename(key, newName),
    updateSchema: (key, params) => mgr.update(key, params),
  };
}
