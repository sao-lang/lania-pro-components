import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface DragSortConfig<T = Record<string, unknown>> {
  type?: 'handle' | 'row';
  handleRender?: () => ReactNode;
  onDragSortEnd?: (newDataSource: T[], oldDataSource: T[]) => void;
  disabled?: boolean | ((record: T, index: number) => boolean);
}

export interface DragState {
  draggingIndex: number | null;
  overIndex: number | null;
  isDragging: boolean;
}

export interface UseDragSortReturn<T = Record<string, unknown>> {
  dragState: DragState;
  sortedDataSource: T[];
  handleDragStart: (index: number) => void;
  handleDragOver: (index: number) => void;
  handleDragEnd: () => void;
  handleDrop: (targetIndex: number) => void;
  getDragRowProps: (
    index: number,
    record: T,
  ) => {
    draggable: boolean;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    style: React.CSSProperties;
  };
  getDragHandleProps: (index: number) => {
    draggable: boolean;
    onDragStart: () => void;
    style: React.CSSProperties;
    className: string;
  };
  resetSort: () => void;
  setDataSource: (data: T[]) => void;
}

export function useDragSort<T = Record<string, unknown>>(options: {
  dataSource: T[];
  config?: DragSortConfig<T>;
  enabled?: boolean;
  getRowKey: (record: T) => string | number;
}): UseDragSortReturn<T> {
  const { dataSource, config, enabled = false, getRowKey } = options;

  const { type = 'handle', onDragSortEnd, disabled } = config || {};

  const [sortedDataSource, setSortedDataSource] = useState<T[]>(dataSource);
  const [dragState, setDragState] = useState<DragState>({
    draggingIndex: null,
    overIndex: null,
    isDragging: false,
  });

  const originalDataSourceRef = useRef<T[]>(dataSource);
  const sortedDataSourceRef = useRef<T[]>(dataSource);

  useEffect(() => {
    const isDifferent =
      dataSource.length !== originalDataSourceRef.current.length ||
      dataSource.some((item, index) => {
        const originalItem = originalDataSourceRef.current[index];
        return getRowKey(item) !== getRowKey(originalItem);
      });

    if (isDifferent) {
      originalDataSourceRef.current = dataSource;
      setSortedDataSource(dataSource);
      sortedDataSourceRef.current = dataSource;
    }
  }, [dataSource, getRowKey]);

  const isDisabled = useCallback(
    (record: T, index: number): boolean => {
      if (!enabled) {
        return true;
      }
      if (typeof disabled === 'function') {
        return disabled(record, index);
      }
      return !!disabled;
    },
    [enabled, disabled],
  );

  const handleDragStart = useCallback((index: number) => {
    setDragState({
      draggingIndex: index,
      overIndex: null,
      isDragging: true,
    });
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragState((prev) => ({
      ...prev,
      overIndex: index,
    }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggingIndex: null,
      overIndex: null,
      isDragging: false,
    });
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      const { draggingIndex } = dragState;

      if (draggingIndex === null || draggingIndex === targetIndex) {
        handleDragEnd();
        return;
      }

      const newDataSource = [...sortedDataSourceRef.current];
      const [movedItem] = newDataSource.splice(draggingIndex, 1);
      newDataSource.splice(targetIndex, 0, movedItem);

      setSortedDataSource(newDataSource);
      sortedDataSourceRef.current = newDataSource;

      if (onDragSortEnd) {
        onDragSortEnd(newDataSource, originalDataSourceRef.current);
      }

      handleDragEnd();
    },
    [dragState, onDragSortEnd, handleDragEnd],
  );

  const getDragRowProps = useCallback(
    (index: number, record: T) => {
      const disabled = isDisabled(record, index);

      return {
        draggable: type === 'row' && !disabled,
        onDragStart: () => {
          if (!disabled) {
            handleDragStart(index);
          }
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled && dragState.isDragging) {
            handleDragOver(index);
          }
        },
        onDragEnd: handleDragEnd,
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled) {
            handleDrop(index);
          }
        },
        style: {
          opacity: dragState.draggingIndex === index ? 0.5 : 1,
          backgroundColor:
            dragState.overIndex === index && dragState.draggingIndex !== index ? 'rgba(22, 93, 255, 0.1)' : undefined,
          cursor: type === 'row' && !disabled ? 'move' : 'default',
        } satisfies React.CSSProperties,
      };
    },
    [type, isDisabled, dragState, handleDragStart, handleDragOver, handleDragEnd, handleDrop],
  );

  const getDragHandleProps = useCallback(
    (index: number) => {
      const record = sortedDataSourceRef.current[index];
      const disabled = isDisabled(record, index);

      return {
        draggable: !disabled,
        onDragStart: () => {
          if (!disabled) {
            handleDragStart(index);
          }
        },
        style: {
          cursor: disabled ? 'not-allowed' : 'move',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
        } satisfies React.CSSProperties,
        className: 'pro-table-drag-handle',
      };
    },
    [isDisabled, handleDragStart],
  );

  const resetSort = useCallback(() => {
    setSortedDataSource(originalDataSourceRef.current);
    sortedDataSourceRef.current = originalDataSourceRef.current;
  }, []);

  const setDataSource = useCallback((data: T[]) => {
    setSortedDataSource(data);
    sortedDataSourceRef.current = data;
  }, []);

  return {
    dragState,
    sortedDataSource,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    getDragRowProps,
    getDragHandleProps,
    resetSort,
    setDataSource,
  };
}

export default useDragSort;