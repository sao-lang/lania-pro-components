/**
 * useDraft — 草稿持久化 Hook
 *
 * 将 DraftEngine 集成到 ProForm 的 React 生命周期中。
 * 提供：
 * - 组件挂载时自动检查并恢复草稿
 * - 值变化时自动防抖保存（基于 watch）
 * - 提交成功后自动清除草稿
 * - 草稿状态通知（方便 UI 展示恢复提示）
 * - 组件卸载时自动销毁引擎
 *
 * @example
 * ```tsx
 * const { draftEngine, draftStatus, hasDraft, clearDraft } = useDraft({
 *   formKey: 'user-edit-123',
 *   formStore,
 *   onDraftRestored: (values) => setFieldsValue(values),
 * });
 *
 * // 有草稿时展示恢复提示
 * if (hasDraft) {
 *   return <DraftRestoreBanner onRestore={() => draftEngine?.load()} />;
 * }
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { DraftEngine, createDraftEngine } from '../core/DraftEngine';
import type { DraftEngineConfig, DraftData, DraftStatus } from '../core/DraftEngine';
import type { FormStore } from '../core/FormStore';

/**
 * useDraft 配置选项
 */
export interface UseDraftOptions extends Omit<DraftEngineConfig, 'formKey'> {
  /** 表单标识（必填，用于多实例隔离） */
  formKey: string;
  /** FormStore 实例 */
  formStore: FormStore | null;
  /** 是否启用草稿持久化 */
  enabled?: boolean;
  /** 草稿恢复回调：有草稿且用户选择恢复时调用 */
  onDraftRestored?: (values: Record<string, unknown>) => void;
  /** 草稿存在但未恢复时的回调（用于展示提示） */
  onDraftAvailable?: (data: DraftData) => void;
}

/**
 * useDraft 返回值
 */
export interface UseDraftReturn {
  /** 草稿引擎实例 */
  draftEngine: DraftEngine | null;
  /** 草稿状态 */
  draftStatus: DraftStatus;
  /** 是否有草稿（用于条件渲染恢复提示） */
  hasDraft: boolean;
  /** 恢复草稿：从存储读取并调用 onDraftRestored */
  restoreDraft: () => void;
  /** 丢弃草稿：删除存储中的草稿 */
  discardDraft: () => void;
  /** 手动保存草稿 */
  saveDraft: () => void;
  /** 获取草稿保存时间 */
  getSavedAt: () => number | null;
  /** 获取草稿已存在时长 */
  getDraftAge: () => number | null;
}

/**
 * useDraft Hook
 *
 * 在 ProForm 中使用草稿持久化功能。
 *
 * @example
 * ```tsx
 * const { hasDraft, restoreDraft, discardDraft } = useDraft({
 *   formKey: `user-form-${userId}`,
 *   formStore,
 *   autoSaveDelay: 3000,
 *   onDraftRestored: (values) => {
 *     arcoForm.setFieldsValue(values);
 *     formStore.setValues(values);
 *   },
 *   onDraftAvailable: (data) => {
 *     message.info(`发现上次未提交的草稿（${formatRelativeTime(data.savedAt)}）`);
 *   },
 * });
 * ```
 */
export function useDraft(options: UseDraftOptions): UseDraftReturn {
  const {
    formKey,
    formStore,
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

  // 创建 DraftEngine 实例
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
      onSave: (data) => {
        setDraftStatus('saved');
        if (onSave) onSave(data);
      },
      onLoad: (data) => {
        if (onLoad) onLoad(data);
      },
      onRemove: (key) => {
        setDraftStatus('none');
        setHasDraft(false);
        if (onRemove) onRemove(key);
      },
      onSaveError,
    });

    draftEngineRef.current = engine;

    return () => {
      // 组件卸载时清理
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      engine.destroy();
      draftEngineRef.current = null;
      initializedRef.current = false;
    };
  }, [enabled, formKey, autoSaveDelay, ttl, storage, onSave, onLoad, onRemove, onSaveError]);

  // 初始化：检查草稿 + 订阅值变化进行自动保存
  useEffect(() => {
    if (!enabled || !formStore || !draftEngineRef.current || initializedRef.current) {
      return;
    }

    const engine = draftEngineRef.current;
    initializedRef.current = true;

    // 1. 检查是否有草稿
    const existingDraft = engine.load();
    if (existingDraft) {
      setHasDraft(true);
      setDraftStatus('exists');
      onDraftAvailable?.(existingDraft);
    }

    // 2. 订阅 FormStore 值变化，自动保存草稿
    const unsubscribe = formStore.subscribeToValueChange(() => {
      const values = formStore.getValues();
      engine.autoSave(values);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, formStore, onDraftAvailable]);

  // 恢复草稿
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

  // 丢弃草稿
  const discardDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine) return;

    engine.remove();
    setDraftStatus('none');
    setHasDraft(false);
  }, []);

  // 手动保存
  const saveDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine || !formStore) return;

    const values = formStore.getValues();
    engine.saveImmediately(values);
  }, [formStore]);

  // 获取保存时间
  const getSavedAt = useCallback(() => {
    return draftEngineRef.current?.getSavedAt() ?? null;
  }, []);

  // 获取草稿时长
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
