import { ProSelect } from '@lania-pro-components/components';
import { useState } from 'react';

const simulateApi = ({
  keyword = '',
  page = 1,
  pageSize = 10,
}: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}) => {
  const total = 45;
  const allData = Array.from({ length: total }, (_, i) => ({
    label: `选项 ${i + 1}`,
    value: i + 1,
  }));
  const filtered = allData.filter((item) => item.label.includes(keyword));
  const start = (page - 1) * pageSize;
  return Promise.resolve({
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
  });
};

const Demo = () => {
  const [, setValue] = useState<number | undefined>();

  return (
    <ProSelect
      pagination
      pageSize={10}
      placeholder='滚动加载更多'
      request={({ keyword, page, pageSize }) => simulateApi({ keyword, page, pageSize })}
      onChange={setValue}
    />
  );
};

export default Demo;
