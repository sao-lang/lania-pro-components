/* eslint-disable @typescript-eslint/no-invalid-void-type */
import type { ReactNode } from 'react';

/**
 * 编辑配置
 */
export interface EditableConfig<T = Record<string, unknown>> {
  /** 编辑模式：单行或多行 */
  type?: 'single' | 'multiple';
  /** 正在编辑的行 keys */
  editableKeys?: (string | number)[];
  /** 编辑行变化回调 */
  onChange?: (editableKeys: (string | number)[], editableRows: T[]) => void;
  /** 保存回调 */
  onSave?: (rowKey: string | number, data: T, row: T) => Promise<boolean | void>;
  /** 删除回调 */
  onDelete?: (rowKey: string | number, row: T) => Promise<boolean | void>;
  /** 取消回调 */
  onCancel?: (rowKey: string | number, row: T, newRow?: T) => Promise<boolean | void>;
  /** 自定义操作渲染 */
  actionRender?: (row: T, config: EditableConfig<T>, defaultDom: ReactNode) => ReactNode[];
}

/**
 * 编辑行状态
 */
export interface EditableRowState<T = Record<string, unknown>> {
  /** 行 key */
  rowKey: string | number;
  /** 原始数据 */
  originData: T;
  /** 当前编辑数据 */
  currentData: T;
  /** 是否正在保存 */
  saving: boolean;
  /** 是否正在删除 */
  deleting: boolean;
}

/**
 * 编辑单元格配置
 */
export interface EditableCellConfig<T = Record<string, unknown>> {
  /** 字段名 */
  dataIndex: string | string[];
  /** 编辑组件类型 */
  valueType?: string;
  /** 编辑组件属性 */
  fieldProps?: Record<string, unknown>;
  /** 自定义编辑渲染 */
  renderFormItem?: (
    text: unknown,
    record: T,
    index: number,
    formProps: { value: unknown; onChange: (value: unknown) => void },
  ) => ReactNode;
  /** 是否可编辑 */
  editable?: boolean | ((text: unknown, record: T, index: number) => boolean);
}

/**
 * 编辑操作类型
 */
export type EditableActionType = 'save' | 'cancel' | 'delete' | 'edit';

/**
 * 可编辑表格实例
 */
export interface EditableTableInstance<T = Record<string, unknown>> {
  /** 开始编辑 */
  startEditable: (rowKey: string | number) => boolean;
  /** 取消编辑 */
  cancelEditable: (rowKey: string | number) => Promise<boolean>;
  /** 保存编辑 */
  saveEditable: (rowKey: string | number) => Promise<boolean>;
  /** 删除行 */
  deleteEditable: (rowKey: string | number) => Promise<boolean>;
  /** 获取编辑中的行 */
  getEditableRows: () => T[];
  /** 获取编辑中的行 keys */
  getEditableKeys: () => (string | number)[];
  /** 设置编辑行数据 */
  setEditableRowData: (rowKey: string | number, data: Partial<T>) => void;
  /** 获取编辑行数据 */
  getEditableRowData: (rowKey: string | number) => T | undefined;
}
