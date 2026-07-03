/**
 * Pagination — 表格分页组件
 *
 * 在表格底部渲染分页器，与 DataStore 的 pagination 状态双向绑定：
 * - 页码/每页数量变更时自动更新 DataStore
 * - 支持自定义每页数量选项
 * - 页码变化自动触发数据请求
 */
import React from 'react';
import { Pagination as ArcoPagination } from '@arco-design/web-react';
import { useDataContext } from '../context';

export interface PaginationProps {
  pageSizeOptions?: number[];
}

/**
 * Pagination - 分页组件
 */
export const Pagination: React.FC<PaginationProps> = ({ pageSizeOptions = [10, 20, 50, 100] }) => {
  const { pagination, total, setPage, setPageSize, loading } = useDataContext();
  const { current, pageSize } = pagination;

  if (total === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
      <ArcoPagination
        current={current}
        pageSize={pageSize}
        total={total}
        sizeCanChange
        pageSizeChangeResetCurrent={false}
        sizeOptions={pageSizeOptions}
        onChange={(pageNumber: number, pageSizeValue: number) => {
          setPage(pageNumber);
          if (pageSizeValue !== pageSize) {
            setPageSize(pageSizeValue);
          }
        }}
        disabled={loading}
      />
    </div>
  );
};
