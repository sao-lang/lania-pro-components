/**
 * SearchSchemaBar — 查询方案管理条
 *
 * 包装 SearchSchemaSelector（从 ProTable/components/SearchSchemaSelector import）
 * 布局：渲染在查询表单右上角
 */

import React from 'react';
import type { ProFormInstance } from '../ProForm/types';
import { SearchSchemaSelector } from '../ProTable/components/SearchSchemaSelector';
import type { SearchSchema } from '../ProTable/hooks/useSearchSchema';

export interface SearchSchemaBarProps {
  /** 方案列表 */
  schemas: SearchSchema[];
  /** 当前选中的方案 key */
  currentSchema?: string;
  /** 切换方案回调 */
  onSwitch: (key: string) => void;
  /** 保存方案回调 */
  onSave: (name: string, params?: Record<string, unknown>) => void;
  /** 删除方案回调 */
  onDelete: (key: string) => void;
  /** 重命名方案回调 */
  onRename?: (key: string, newName: string) => void;
  /** 清空所有方案回调 */
  onClear?: () => void;
  /** ProForm 实例引用（用于获取当前表单值） */
  formRef: React.RefObject<ProFormInstance | null>;
  /** 额外的参数来源（如 store.query） */
  extraParams?: Record<string, unknown>;
}

/**
 * SearchSchemaBar 组件
 *
 * 查询方案管理条，渲染在查询表单右上角
 */
export const SearchSchemaBar: React.FC<SearchSchemaBarProps> = ({
  schemas,
  currentSchema,
  onSwitch,
  onSave,
  onDelete,
  onRename,
  onClear,
  formRef,
  extraParams,
}) => {
  return (
    <div
      className='pro-query-form-schema-bar'
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 8,
      }}
    >
      <SearchSchemaSelector
        schemas={schemas}
        currentSchema={currentSchema}
        onSwitch={onSwitch}
        onSave={onSave}
        onDelete={onDelete}
        onRename={onRename}
        onClear={onClear}
        getCurrentParams={() => ({
          ...extraParams,
          ...formRef.current?.getFieldsValue(),
        })}
      />
    </div>
  );
};
