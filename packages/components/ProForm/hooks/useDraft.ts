/**
 * @deprecated 请从 @lania-pro-components/shared 导入 useDraft
 * 此文件为向后兼容保留的适配器壳
 */
import type { DraftEngineConfig, DraftData } from '@lania-pro-components/utils';
import type { FormStore } from '../core/FormStore';
import { useDraft as useDraftShared, type UseDraftReturn, type DraftStoreLike } from '@lania-pro-components/shared';

export interface UseDraftOptions extends Omit<DraftEngineConfig, 'formKey'> {
  formKey: string;
  formStore: FormStore | null;
  enabled?: boolean;
  onDraftRestored?: (values: Record<string, unknown>) => void;
  onDraftAvailable?: (data: DraftData) => void;
}

export const useDraft = (options: UseDraftOptions): UseDraftReturn => {
  const { formStore, ...rest } = options;
  const store: DraftStoreLike | null = formStore
    ? {
        subscribeToValueChange: (callback: () => void) => formStore.subscribeToValueChange(() => callback()),
        getValues: formStore.getValues.bind(formStore),
      }
    : null;

  return useDraftShared({
    ...rest,
    store,
  });
};

export default useDraft;
