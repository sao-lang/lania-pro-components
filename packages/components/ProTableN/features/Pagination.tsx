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
