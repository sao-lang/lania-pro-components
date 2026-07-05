import { useEffect, useRef, useState, useCallback } from 'react';
import { DraftEngine, createDraftEngine } from '@lania-pro-components/utils';
import type { DraftEngineConfig, DraftData, DraftStatus } from '@lania-pro-components/utils';

export interface DraftStoreLike {
  subscribeToValueChange: (callback: () => void) => () => void;
  getValues: () => Record<string, unknown>;
}

export interface UseDraftOptions extends Omit<DraftEngineConfig, 'formKey'> {
  formKey: string;
  store?: DraftStoreLike | null;
  enabled?: boolean;
  onDraftRestored?: (values: Record<string, unknown>) => void;
  onDraftAvailable?: (data: DraftData) => void;
}

export interface UseDraftReturn {
  draftEngine: DraftEngine | null;
  draftStatus: DraftStatus;
  hasDraft: boolean;
  restoreDraft: () => void;
  discardDraft: () => void;
  saveDraft: () => void;
  getSavedAt: () => number | null;
  getDraftAge: () => number | null;
}

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
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      engine.destroy();
      draftEngineRef.current = null;
      initializedRef.current = false;
    };
  }, [enabled, formKey, autoSaveDelay, ttl, storage, onSave, onLoad, onRemove, onSaveError]);

  useEffect(() => {
    if (!enabled || !store || !draftEngineRef.current || initializedRef.current) {
      return;
    }

    const engine = draftEngineRef.current;
    initializedRef.current = true;

    const existingDraft = engine.load();
    if (existingDraft) {
      setHasDraft(true);
      setDraftStatus('exists');
      onDraftAvailable?.(existingDraft);
    }

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

  const discardDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine) return;

    engine.remove();
    setDraftStatus('none');
    setHasDraft(false);
  }, []);

  const saveDraft = useCallback(() => {
    const engine = draftEngineRef.current;
    if (!engine || !store) return;

    const values = store.getValues();
    engine.saveImmediately(values);
  }, [store]);

  const getSavedAt = useCallback(() => {
    return draftEngineRef.current?.getSavedAt() ?? null;
  }, []);

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