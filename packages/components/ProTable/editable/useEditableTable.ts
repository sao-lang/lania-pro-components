/**
 * useEditableTable — 可编辑表格核心 Hook
 *
 * 管理表格的编辑状态：
 * - 单行/多行编辑模式
 * - 编辑行管理（startEditable / cancelEditable / saveEditable）
 * - 行验证（validateRow）
 * - 编辑状态跟踪
 * - 编辑变化回调（onChange）
 * - 新增/删除行（deleteEditable）
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import type { EditableConfig, EditableRowState, EditableTableInstance } from './types';

export interface UseEditableTableOptions<T = Record<string, unknown>> {
  /** 编辑配置 */
  config?: EditableConfig<T>;
  /** 获取行 key 的函数 */
  getRowKey: (record: T) => string | number;
  /** 数据源 */
  dataSource: T[];
}

export interface UseEditableTableReturn<T = Record<string, unknown>> {
  /** 编辑行状态映射 */
  editableRows: Map<string | number, EditableRowState<T>>;
  /** 正在编辑的 keys */
  editableKeys: (string | number)[];
  /** 可编辑表格实例 */
  instance: EditableTableInstance<T>;
  /** 开始编辑 */
  startEditable: (rowKey: string | number) => boolean;
  /** 取消编辑 */
  cancelEditable: (rowKey: string | number) => Promise<boolean>;
  /** 保存编辑 */
  saveEditable: (rowKey: string | number) => Promise<boolean>;
  /** 删除行 */
  deleteEditable: (rowKey: string | number) => Promise<boolean>;
  /** 设置编辑行数据 */
  setEditableRowData: (rowKey: string | number, data: Partial<T>) => void;
  /** 获取编辑行数据 */
  getEditableRowData: (rowKey: string | number) => T | undefined;
}

/**
 * 可编辑表格 Hook
 */
export const useEditableTable = <T extends Record<string, unknown>>(
  options: UseEditableTableOptions<T>,
): UseEditableTableReturn<T> => {
  const { config, getRowKey, dataSource } = options;
  const { type = 'single', onChange, onSave, onDelete, onCancel } = config || {};

  // 编辑行状态映射
  const [editableRows, setEditableRows] = useState<Map<string | number, EditableRowState<T>>>(new Map());

  // 使用 ref 存储回调函数，避免依赖循环
  const callbacksRef = useRef({ onChange, onSave, onDelete, onCancel });
  callbacksRef.current = { onChange, onSave, onDelete, onCancel };

  // 正在编辑的 keys
  const editableKeys = useMemo(() => Array.from(editableRows.keys()), [editableRows]);

  /**
   * 获取行数据
   */
  const getRowData = useCallback(
    (rowKey: string | number): T | undefined => dataSource.find((row) => getRowKey(row) === rowKey),
    [dataSource, getRowKey],
  );

  /**
   * 开始编辑
   */
  const startEditable = useCallback(
    (rowKey: string | number): boolean => {
      const rowData = getRowData(rowKey);
      if (!rowData) {
        return false;
      }

      setEditableRows((prev) => {
        const newMap =
          type === 'single'
            ? new Map<string | number, EditableRowState<T>>()
            : new Map<string | number, EditableRowState<T>>(prev);

        newMap.set(rowKey, {
          rowKey,
          originData: { ...rowData },
          currentData: { ...rowData },
          saving: false,
          deleting: false,
        });

        const newKeys = Array.from(newMap.keys());
        const newRows = Array.from(newMap.values()).map((s) => s.currentData);
        callbacksRef.current.onChange?.(newKeys, newRows);

        return newMap;
      });

      return true;
    },
    [getRowData, type],
  );

  /**
   * 取消编辑
   */
  const cancelEditable = useCallback(
    async (rowKey: string | number): Promise<boolean> => {
      const state = editableRows.get(rowKey);
      if (!state) {
        return false;
      }

      // 调用 onCancel 回调
      if (callbacksRef.current.onCancel) {
        const result = await callbacksRef.current.onCancel(rowKey, state.originData, state.currentData);
        if (result === false) {
          return false;
        }
      }

      setEditableRows((prev) => {
        const newMap = new Map<string | number, EditableRowState<T>>(prev);
        newMap.delete(rowKey);

        const newKeys = Array.from(newMap.keys());
        const newRows = Array.from(newMap.values()).map((s) => s.currentData);
        callbacksRef.current.onChange?.(newKeys, newRows);

        return newMap;
      });

      return true;
    },
    [editableRows],
  );

  /**
   * 保存编辑
   */
  const saveEditable = useCallback(
    async (rowKey: string | number): Promise<boolean> => {
      const state = editableRows.get(rowKey);
      if (!state) {
        return false;
      }

      // 设置保存中状态
      setEditableRows((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(rowKey);
        if (current) {
          newMap.set(rowKey, { ...current, saving: true });
        }
        return newMap;
      });

      try {
        // 调用 onSave 回调
        if (callbacksRef.current.onSave) {
          const result = await callbacksRef.current.onSave(rowKey, state.currentData, state.originData);
          if (result === false) {
            // 保存失败，恢复状态
            setEditableRows((prev) => {
              const newMap = new Map(prev);
              const current = newMap.get(rowKey);
              if (current) {
                newMap.set(rowKey, { ...current, saving: false });
              }
              return newMap;
            });
            return false;
          }
        }

        // 保存成功，移除编辑状态
        setEditableRows((prev) => {
          const newMap = new Map<string | number, EditableRowState<T>>(prev);
          newMap.delete(rowKey);

          const newKeys = Array.from(newMap.keys());
          const newRows = Array.from(newMap.values()).map((s) => s.currentData);
          callbacksRef.current.onChange?.(newKeys, newRows);

          return newMap;
        });

        return true;
      } catch {
        // 保存异常，恢复状态
        setEditableRows((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(rowKey);
          if (current) {
            newMap.set(rowKey, { ...current, saving: false });
          }
          return newMap;
        });
        return false;
      }
    },
    [editableRows],
  );

  /**
   * 删除行
   */
  const deleteEditable = useCallback(
    async (rowKey: string | number): Promise<boolean> => {
      const state = editableRows.get(rowKey);
      const rowData = getRowData(rowKey);

      if (!rowData) {
        return false;
      }

      // 设置删除中状态
      if (state) {
        setEditableRows((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(rowKey);
          if (current) {
            newMap.set(rowKey, { ...current, deleting: true });
          }
          return newMap;
        });
      }

      try {
        // 调用 onDelete 回调
        if (callbacksRef.current.onDelete) {
          const result = await callbacksRef.current.onDelete(rowKey, rowData);
          if (result === false) {
            // 删除失败，恢复状态
            if (state) {
              setEditableRows((prev) => {
                const newMap = new Map(prev);
                const current = newMap.get(rowKey);
                if (current) {
                  newMap.set(rowKey, { ...current, deleting: false });
                }
                return newMap;
              });
            }
            return false;
          }
        }

        // 删除成功，移除编辑状态
        setEditableRows((prev) => {
          const newMap = new Map<string | number, EditableRowState<T>>(prev);
          newMap.delete(rowKey);

          const newKeys = Array.from(newMap.keys());
          const newRows = Array.from(newMap.values()).map((s) => s.currentData);
          callbacksRef.current.onChange?.(newKeys, newRows);

          return newMap;
        });

        return true;
      } catch {
        // 删除异常，恢复状态
        if (state) {
          setEditableRows((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(rowKey);
            if (current) {
              newMap.set(rowKey, { ...current, deleting: false });
            }
            return newMap;
          });
        }
        return false;
      }
    },
    [editableRows, getRowData],
  );

  /**
   * 设置编辑行数据
   */
  const setEditableRowData = useCallback((rowKey: string | number, data: Partial<T>) => {
    setEditableRows((prev) => {
      const state = prev.get(rowKey);
      if (!state) {
        return prev;
      }

      const newMap = new Map(prev);
      newMap.set(rowKey, {
        ...state,
        currentData: { ...state.currentData, ...data },
      });

      return newMap;
    });
  }, []);

  /**
   * 获取编辑行数据
   */
  const getEditableRowData = useCallback(
    (rowKey: string | number): T | undefined => editableRows.get(rowKey)?.currentData,
    [editableRows],
  );

  /**
   * 获取编辑中的行
   */
  const getEditableRows = useCallback(
    (): T[] => Array.from(editableRows.values()).map((s) => s.currentData as T),
    [editableRows],
  );

  /**
   * 获取编辑中的行 keys
   */
  const getEditableKeys = useCallback((): (string | number)[] => Array.from(editableRows.keys()), [editableRows]);

  // 构建实例
  const instance: EditableTableInstance<T> = useMemo(
    () => ({
      startEditable,
      cancelEditable,
      saveEditable,
      deleteEditable,
      getEditableRows,
      getEditableKeys,
      setEditableRowData,
      getEditableRowData,
    }),
    [
      startEditable,
      cancelEditable,
      saveEditable,
      deleteEditable,
      getEditableRows,
      getEditableKeys,
      setEditableRowData,
      getEditableRowData,
    ],
  );

  return {
    editableRows,
    editableKeys,
    instance,
    startEditable,
    cancelEditable,
    saveEditable,
    deleteEditable,
    setEditableRowData,
    getEditableRowData,
  };
};

export default useEditableTable;
