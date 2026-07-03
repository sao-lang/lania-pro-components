/**
 * QueryFormRenderer — 查询表单渲染器
 *
 * 接收 schemas（已转换）+ formProps（透传 ProForm）
 * 调用 <ProForm> 渲染查询控件
 * 支持折叠模式（collapsible / defaultCollapsed / collapsedRows）
 */

import React from 'react';
import { ProForm } from '../ProForm';
import type { ProFormInstance, ProFormSchema, ProFormProps } from '../ProForm/types';

export interface QueryFormRendererProps {
  /** 已转换的 ProFormSchema 列表 */
  schemas: ProFormSchema[];
  /** ProForm 实例引用 */
  formRef: React.RefObject<ProFormInstance | null>;
  /** 表单布局 */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** Grid 列数 */
  columns?: number;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认是否折叠 */
  defaultCollapsed?: boolean;
  /** 折叠行数 */
  collapsedRows?: number;
  /** 是否显示提交按钮 */
  showSubmitButton?: boolean;
  /** 是否显示重置按钮 */
  showResetButton?: boolean;
  /** 提交按钮文本 */
  submitText?: string;
  /** 重置按钮文本 */
  resetText?: string;
  /** 查询回调 */
  onSearch?: (values: Record<string, unknown>) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 透传给 ProForm 的配置 */
  formProps?: Omit<ProFormProps, 'schemas' | 'onFinish' | 'onReset'>;
}

/**
 * QueryFormRenderer 组件
 *
 * 封装 ProForm 渲染查询表单，处理查询/重置事件
 */
export const QueryFormRenderer: React.FC<QueryFormRendererProps> = ({
  schemas,
  formRef,
  layout = 'inline',
  columns = 3,
  collapsible = true,
  defaultCollapsed = true,
  collapsedRows = 1,
  showSubmitButton = true,
  showResetButton = true,
  submitText = '查询',
  resetText = '重置',
  onSearch,
  onReset,
  formProps,
}) => {
  return (
    <div className='pro-query-form-renderer' style={{ marginBottom: 16 }}>
      <ProForm
        ref={formRef}
        schemas={schemas}
        layout={layout}
        columns={columns}
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        collapsedRows={collapsedRows}
        showSubmitButton={showSubmitButton}
        showResetButton={showResetButton}
        submitText={submitText as string | undefined}
        resetText={resetText as string | undefined}
        onFinish={onSearch}
        onReset={onReset}
        {...formProps}
      />
    </div>
  );
};
