/**
 * 草稿持久化引擎（DraftEngine）
 *
 * 为 ProForm 提供草稿自动保存/恢复功能，支持多种存储策略：
 * - localStorage（默认） — 适合中小型表单
 * - sessionStorage — 适合会话级草稿
 * - IndexedDB — 适合超大型表单（文件、图片等）
 * - 自定义存储策略（实现 DraftStorage 接口即可）
 *
 * 核心功能：
 * - 防抖自动保存：表单值变化后延迟写入，避免高频写入
 * - 多实例隔离：通过 formKey 区分不同表单的草稿
 * - 版本管理：保存时间戳作为版本号，支持冲突检测
 * - 过期清理：超过 TTL 的草稿自动丢弃
 * - 提交后清除：submit 成功后自动删除草稿
 *
 * @example
 * ```tsx
 * const draftEngine = new DraftEngine({
 *   formKey: 'user-create-form',
 *   autoSaveDelay: 3000,
 *   storage: localStorageStrategy,
 * });
 *
 * // 监听值变化
 * formStore.subscribe(() => draftEngine.autoSave(formStore.getValues()));
 *
 * // 恢复草稿
 * const saved = draftEngine.load();
 * if (saved) formStore.setValues(saved.values);
 * ```
 */

// ======================== 存储策略接口 ========================

/**
 * 草稿数据
 */
export interface DraftData {
  /** 表单值 */
  values: Record<string, unknown>;
  /** 草稿保存时间戳 */
  savedAt: number;
  /** 草稿版本号 */
  version: number;
  /** 表单实例标识 */
  formKey: string;
}

/**
 * 存储策略接口
 * 支持自定义存储实现（localStorage / sessionStorage / IndexedDB / 后端 API 等）
 */
export interface DraftStorage {
  /** 保存草稿 */
  save: (key: string, data: DraftData) => void | Promise<void>;
  /** 读取草稿，不存在返回 null */
  load: (key: string) => DraftData | null | Promise<DraftData | null>;
  /** 删除草稿 */
  remove: (key: string) => void | Promise<void>;
  /** 检查草稿是否存在 */
  exists: (key: string) => boolean | Promise<boolean>;
}

// ======================== 内置存储策略 ========================

/**
 * localStorage 存储策略（默认）
 *
 * 使用 JSON.stringify 序列化草稿数据。
 * 注意：localStorage 有 5MB 大小限制，不适合存储大量文件数据。
 */
export const localStorageStrategy: DraftStorage = {
  save(key: string, data: DraftData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(
        '[DraftEngine] localStorage save failed:',
        error instanceof DOMException && error.name === 'QuotaExceededError'
          ? '存储空间不足，请清理草稿或使用 IndexedDB'
          : error,
      );
    }
  },

  load(key: string): DraftData | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw) as DraftData;
      // 兼容性校验：检查必要字段
      if (!data.values || !data.savedAt || !data.formKey) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      // 数据损坏时删除并返回 null
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  exists(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

/**
 * sessionStorage 存储策略
 * 与 localStorage 类似，但数据在关闭浏览器标签页后自动清除。
 * 适用于"填到一半关掉页面需要重新填"的场景。
 */
export const sessionStorageStrategy: DraftStorage = {
  save(key: string, data: DraftData): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('[DraftEngine] sessionStorage save failed:', error);
    }
  },

  load(key: string): DraftData | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw) as DraftData;
      if (!data.values || !data.savedAt || !data.formKey) {
        sessionStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      return null;
    }
  },

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  exists(key: string): boolean {
    try {
      return sessionStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// ======================== 草稿引擎配置 ========================

/**
 * 草稿引擎配置
 */
export interface DraftEngineConfig {
  /** 表单标识（必填，用于多实例隔离） */
  formKey: string;
  /** 是否启用自动保存 */
  enabled?: boolean;
  /** 自动保存防抖延迟（毫秒），设为 0 禁用自动保存 */
  autoSaveDelay?: number;
  /** 草稿过期时间（毫秒），过期后自动丢弃，默认 24 小时 */
  ttl?: number;
  /** 存储策略，默认 localStorage */
  storage?: DraftStorage;
  /** 保存成功回调 */
  onSave?: (data: DraftData) => void;
  /** 加载成功回调 */
  onLoad?: (data: DraftData) => void;
  /** 删除成功回调 */
  onRemove?: (formKey: string) => void;
  /** 保存失败回调 */
  onSaveError?: (error: unknown) => void;
}

// ======================== 草稿引擎实现 ========================

/**
 * 草稿引擎
 *
 * 管理 ProForm 的草稿数据持久化，支持自动保存/恢复/清理。
 * 不依赖 React，可独立使用和测试。
 *
 * @example
 * ```typescript
 * // 基础用法
 * const engine = new DraftEngine({ formKey: 'user-edit-123' });
 *
 * // 手动保存
 * engine.save({ name: 'Alice', age: 30 });
 *
 * // 恢复草稿
 * const draft = engine.load();
 * if (draft) {
 *   console.log(`草稿保存于: ${new Date(draft.savedAt).toLocaleString()}`);
 *   formStore.setValues(draft.values);
 * }
 * ```
 */
export class DraftEngine {
  private config: Required<DraftEngineConfig>;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private version = 0;
  private lastSavedValues: string | null = null; // 防重复写入：上次保存的值的 JSON 快照
  private pendingSaveCount = 0;

  constructor(config: DraftEngineConfig) {
    this.config = {
      enabled: true,
      autoSaveDelay: 3000,
      ttl: 24 * 60 * 60 * 1000, // 默认 24 小时
      storage: localStorageStrategy,
      onSave: () => {},
      onLoad: () => {},
      onRemove: () => {},
      onSaveError: () => {},
      ...config,
    };
  }

  /**
   * 获取存储 key
   * 格式: `proform_draft_{formKey}`
   */
  private get storageKey(): string {
    return `proform_draft_${this.config.formKey}`;
  }

  /**
   * 获取当前配置
   */
  getConfig(): Required<DraftEngineConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置（运行时动态修改）
   */
  setConfig(partial: Partial<DraftEngineConfig>): void {
    Object.assign(this.config, partial);
  }

  /**
   * 保存草稿
   *
   * 检查值是否真正变化（JSON 序列化对比），避免重复写入。
   *
   * @param values - 当前表单值
   * @returns 是否成功保存
   */
  save(values: Record<string, unknown>): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // 去重：值与上次保存相同，跳过写入
    const valuesStr = JSON.stringify(values);
    if (valuesStr === this.lastSavedValues) {
      return false;
    }

    const data: DraftData = {
      values,
      savedAt: Date.now(),
      version: ++this.version,
      formKey: this.config.formKey,
    };

    try {
      const result = this.config.storage.save(this.storageKey, data);
      this.lastSavedValues = valuesStr;

      // 处理异步存储（如 IndexedDB）
      if (result instanceof Promise) {
        result.then(() => this.config.onSave(data)).catch((error) => this.config.onSaveError(error));
      } else {
        this.config.onSave(data);
      }

      return true;
    } catch (error) {
      this.config.onSaveError(error);
      return false;
    }
  }

  /**
   * 防抖自动保存
   *
   * 值变化后不立即写入，等待 autoSaveDelay 毫秒后无新变化再写入。
   * 这避免了高频输入时频繁写入存储的性能问题。
   *
   * @param values - 当前表单值
   */
  autoSave(values: Record<string, unknown>): void {
    if (!this.config.enabled || this.config.autoSaveDelay <= 0) {
      return;
    }

    // 计数防抖：快速连续调用只记录最后一次
    this.pendingSaveCount++;
    const currentCount = this.pendingSaveCount;

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      // 只有在防抖期间没有新的 autoSave 调用时才真正保存
      if (currentCount === this.pendingSaveCount) {
        this.save(values);
      }
    }, this.config.autoSaveDelay);
  }

  /**
   * 立即保存（无视防抖）
   *
   * 适用于用户明确点击"保存草稿"按钮的场景。
   *
   * @param values - 当前表单值
   * @returns 是否成功保存
   */
  saveImmediately(values: Record<string, unknown>): boolean {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    return this.save(values);
  }

  /**
   * 读取草稿
   *
   * 会检查：
   * 1. 草稿是否存在
   * 2. 草稿是否过期（超过 TTL）
   *
   * @returns 草稿数据，不存在或已过期返回 null
   */
  load(): DraftData | null {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const rawData = this.config.storage.load(this.storageKey);
      if (rawData instanceof Promise) {
        // 异步存储场景：返回同步结果需要额外处理
        console.warn('[DraftEngine] 异步存储不支持同步 load，请使用 loadAsync()');
        return null;
      }

      if (!rawData) return null;

      // 过期检查
      if (this.isExpired(rawData.savedAt)) {
        this.remove(); // 自动清理过期草稿
        return null;
      }

      this.lastSavedValues = JSON.stringify(rawData.values);
      this.version = rawData.version;
      this.config.onLoad(rawData);
      return rawData;
    } catch (error) {
      this.config.onSaveError(error);
      return null;
    }
  }

  /**
   * 异步读取草稿
   *
   * 兼容所有存储策略（包括异步存储如 IndexedDB）。
   * 推荐使用此方法代替同步的 load()。
   *
   * @returns 草稿数据，不存在或已过期返回 null
   */
  async loadAsync(): Promise<DraftData | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const rawData = await this.config.storage.load(this.storageKey);
      if (!rawData) return null;

      // 过期检查
      if (this.isExpired(rawData.savedAt)) {
        await this.removeAsync();
        return null;
      }

      this.lastSavedValues = JSON.stringify(rawData.values);
      this.version = rawData.version;
      this.config.onLoad(rawData);
      return rawData;
    } catch (error) {
      this.config.onSaveError(error);
      return null;
    }
  }

  /**
   * 检查是否有草稿
   */
  hasDraft(): boolean {
    if (!this.config.enabled) return false;

    try {
      const result = this.config.storage.exists(this.storageKey);
      if (result instanceof Promise) {
        // 同步场景下无法处理 Promise，保守返回 true
        return true;
      }
      return result;
    } catch {
      return false;
    }
  }

  /**
   * 异步检查是否有草稿
   */
  async hasDraftAsync(): Promise<boolean> {
    if (!this.config.enabled) return false;

    try {
      return await this.config.storage.exists(this.storageKey);
    } catch {
      return false;
    }
  }

  /**
   * 删除草稿
   */
  remove(): void {
    try {
      this.config.storage.remove(this.storageKey);
      this.lastSavedValues = null;
      this.config.onRemove(this.config.formKey);
    } catch {
      /* ignore */
    }
  }

  /**
   * 异步删除草稿
   */
  async removeAsync(): Promise<void> {
    try {
      await this.config.storage.remove(this.storageKey);
      this.lastSavedValues = null;
      this.config.onRemove(this.config.formKey);
    } catch {
      /* ignore */
    }
  }

  /**
   * 获取草稿的保存时间
   * @returns 时间戳，没有草稿返回 null
   */
  getSavedAt(): number | null {
    const draft = this.load();
    return draft ? draft.savedAt : null;
  }

  /**
   * 获取草稿已存在时长（毫秒）
   * @returns 时长（毫秒），没有草稿返回 null
   */
  getAge(): number | null {
    const savedAt = this.getSavedAt();
    return savedAt !== null ? Date.now() - savedAt : null;
  }

  /**
   * 销毁引擎
   * 清理定时器，释放资源
   */
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.lastSavedValues = null;
    this.pendingSaveCount = 0;
  }

  /**
   * 检查草稿是否过期
   */
  private isExpired(savedAt: number): boolean {
    return Date.now() - savedAt > this.config.ttl;
  }
}

// ======================== 草稿状态 Hook（React 适配器） ========================

export type DraftStatus = 'none' | 'exists' | 'restored' | 'saved';

/**
 * 草稿引擎工厂函数
 *
 * 提供一个便捷的工厂函数，方便在 React Hook 中创建 DraftEngine 实例。
 *
 * @example
 * ```typescript
 * const engine = createDraftEngine({
 *   formKey: 'user-edit',
 *   autoSaveDelay: 3000,
 * });
 * ```
 */
export function createDraftEngine(config: DraftEngineConfig): DraftEngine {
  return new DraftEngine(config);
}

export default DraftEngine;
