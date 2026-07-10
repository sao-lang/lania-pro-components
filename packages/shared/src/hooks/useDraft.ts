/**
 * @lania-pro-components/shared
 *
 * useDraft — 表单草稿 Hook
 *
 * 提供表单数据的自动保存与恢复能力，避免用户因意外（刷新、崩溃、误操作）
 * 导致已填写内容丢失。基于 @lania-pro-components/utils 的 DraftEngine 实现：
 * - 自动定时保存（autoSaveDelay）
 * - 手动立即保存（saveDraft）
 * - 草稿恢复（restoreDraft）/ 丢弃（discardDraft）
 * - TTL 过期清理（ttl）
 * - 可选自定义存储介质（localStorage / sessionStorage / 自定义）
 *
 * 设计要点：
 * - 通过 DraftStoreLike 接口抽象具体的状态管理实现（Zustand、Redux、rc-field-form 等），
 *   使本 Hook 不耦合任何具体表单库
 * - 仅订阅 store 的值变化，不关心具体字段结构
 * - 草稿引擎实例由 useRef 持有，避免重渲染
 *
 * @example
 * ```tsx
 * const { hasDraft, draftStatus, restoreDraft, discardDraft, saveDraft } = useDraft({
 *   formKey: 'user-form',
 *   store: formStore,
 *   enabled: true,
 *   autoSaveDelay: 3000,
 *   ttl: 24 * 60 * 60 * 1000,
 *   onDraftRestored: (values) => formStore.setValues(values),
 *   onDraftAvailable: (data) => {
 *     Modal.confirm({ title: '检测到未完成草稿，是否恢复？', onOk: restoreDraft });
 *   },
 * });
 * ```
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { DraftEngine, createDraftEngine } from '@lania-pro-components/utils';
import type { DraftEngineConfig, DraftData, DraftStatus } from '@lania-pro-components/utils';

/**
 * 草稿数据源接口
 *
 * 抽象具体的状态管理实现，使 useDraft 可对接任意 store（Zustand、Redux、rc-field-form 等）。
 * 使用方只需提供「订阅值变化」和「获取当前值」两个能力即可。
 */
export interface DraftStoreLike {
  /** 订阅 store 的值变化，返回取消订阅函数 */
  subscribeToValueChange: (callback: () => void) => () => void;
  /** 获取当前 store 的值快照 */
  getValues: () => Record<string, unknown>;
}

/**
 * useDraft 配置选项
 *
 * 继承自 DraftEngineConfig（除 formKey 外），并扩展了 store 绑定与生命周期回调。
 */
export interface UseDraftOptions extends Omit<DraftEngineConfig, 'formKey'> {
  /** 表单唯一标识，用于区分不同表单的草稿（作为存储 key 的一部分） */
  formKey: string;
  /** 表单状态源，提供值订阅与获取能力；传 null 表示暂不绑定 */
  store?: DraftStoreLike | null;
  /** 是否启用草稿功能（默认 true） */
  enabled?: boolean;
  /** 草稿恢复成功后的回调，通常用于将草稿值回填到表单 */
  onDraftRestored?: (values: Record<string, unknown>) => void;
  /** 检测到已有草稿时的回调，通常用于弹窗询问用户是否恢复 */
  onDraftAvailable?: (data: DraftData) => void;
}

/**
 * useDraft 返回值
 */
export interface UseDraftReturn {
  /** 草稿引擎实例（可能为 null，当未启用或未初始化时） */
  draftEngine: DraftEngine | null;
  /** 当前草稿状态：'none' | 'exists' | 'saved' | 'restored' */
  draftStatus: DraftStatus;
  /** 是否存在未恢复的草稿（与 draftStatus === 'exists' 等价，提供更语义化的判断） */
  hasDraft: boolean;
  /** 恢复草稿：从存储读取草稿值并触发 onDraftRestored 回调 */
  restoreDraft: () => void;
  /** 丢弃草稿：从存储中移除当前 formKey 对应的草稿 */
  discardDraft: () => void;
  /** 手动立即保存草稿（绕过 autoSaveDelay 延迟） */
  saveDraft: () => void;
  /** 获取草稿保存时间戳（毫秒），无草稿时返回 null */
  getSavedAt: () => number | null;
  /** 获取草稿存活时长（毫秒），无草稿时返回 null */
  getDraftAge: () => number | null;
}

/**
 * 表单草稿 Hook
 *
 * 管理表单数据的自动保存、恢复、丢弃等草稿生命周期。
 *
 * @param options - 配置选项
 * @returns 草稿状态与操作方法
 */
export function useDraft(options: UseDraftOptions): UseDraftReturn {
  const {
    formKey,
    store,
    enabled = true,
    autoSaveDelay = 3000,
    ttl = 24 * 60 * 60 * 1000,
    storage,
    onSave,
    onLoad,
    onRemove,
    onSaveError,
    onDraftRestored,
    onDraftAvailable,
  } = options;

  const [draftStatus, setDraftStatus] = useState<DraftStatus>('none');
  const [hasDraft, setHasDraft] = useState(false);
  const draftEngineRef = useRef<DraftEngine | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  // 创建草稿引擎实例：在 formKey / enabled / ttl 等核心配置变化时重建
  useEffect(() => {
    if (!enabled || !formKey) {
      return;
    }

    const engine = createDraftEngine({
      formKey,
      enabled,
      autoSaveDelay,
      ttl,
      storage,
      // 草稿保存成功回调：更新状态为 'saved' 并透传给使用方
      onSave: (data) => {
        setDraftStatus('saved');
        if (onSave) onSave(data);
      },
      // 草稿加载回调：透传给使用方（通常用于数据迁移、兼容性处理）
      onLoad: (data) => {
        if (onLoad) onLoad(data);
      },
      // 草稿移除回调：重置状态为 'none' 并标记 hasDraft=false
      onRemove: (key) => {
        setDraftStatus('none');
        setHasDraft(false);
        if (onRemove) onRemove(key);
      },
      onSaveError,
    });

    draftEngineRef.current = engine;

    return () => {
      // 卸载时取消 store 订阅，销毁引擎，重置初始化标志
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      engine.destroy();
      draftEngineRef.current = null;
      initializedRef.current = false;
    };
  }, [enabled, formKey, autoSaveDelay, ttl, storage, onSave, onLoad, onRemove, onSaveError]);

  // 绑定 store：首次加载已有草稿，并订阅后续值变化触发自动保存
  useEffect(() => {
    if (!enabled || !store || !draftEngineRef.current || initializedRef.current) {
      return;
    }

    const engine = draftEngineRef.current;
    initializedRef.current = true;

    // 首次绑定时尝试加载已有草稿，存在则通知使用方
    const existingDraft = engine.load();
    if (existingDraft) {
      setHasDraft(true);
      setDraftStatus('exists');
      onDraftAvailable?.(existingDraft);
    }

    // 订阅 store 值变化：每次值变化触发引擎的 autoSave（内部会做防抖）
    const unsubscribe = store.subscribeToValueChange(() => {
      const values = store.getValues();
      engine.autoSave(values);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, store, onDraftAvailable]);

  /**
   * 恢复草稿
   *
   * 从存储读取草稿数据，若存在则触发 onDraftRestored 回调，
   * 并将状态标记为 'restored'、hasDraft 置为 false（已恢复，不再提示）。
   */
  const restoreDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine) return;

    const draft = engine.load();
    if (draft && onDraftRestored) {
      onDraftRestored(draft.values);
      setDraftStatus('restored');
      setHasDraft(false);
    }
  }, [onDraftRestored]);

  /**
   * 丢弃草稿
   *
   * 从存储中移除当前 formKey 对应的草稿，并重置状态。
   */
  const discardDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine) return;

    engine.remove();
    setDraftStatus('none');
    setHasDraft(false);
  }, []);

  /**
   * 手动立即保存草稿
   *
   * 从 store 获取最新值并调用引擎的 saveImmediately（绕过 autoSaveDelay 防抖）。
   * 通常在「保存」「提交」按钮失焦或表单卸载前调用。
   */
  const saveDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine || !store) return;

    const values = store.getValues();
    engine.saveImmediately(values);
  }, [store]);

  /**
   * 获取草稿保存时间戳
   *
   * @returns 草稿保存的 Unix 时间戳（毫秒），无草稿时返回 null
   */
  const getSavedAt = useCallback(() => {
    return draftEngineRef.current?.getSavedAt() ?? null;
  }, []);

  /**
   * 获取草稿存活时长
   *
   * @returns 草稿从保存至今的毫秒数，无草稿时返回 null
   */
  const getDraftAge = useCallback(() => {
    return draftEngineRef.current?.getAge() ?? null;
  }, []);

  return {
    draftEngine: draftEngineRef.current,
    draftStatus,
    hasDraft,
    restoreDraft,
    discardDraft,
    saveDraft,
    getSavedAt,
    getDraftAge,
  };
}

export default useDraft;
