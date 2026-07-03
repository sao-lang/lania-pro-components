import { ProSelect } from '@lania-pro-components/components';
const data = [
  { label: '123', value: '1' },
  { label: '62345', value: '2' },
  { label: 'gsdfg', value: '3' },
  { label: '65453', value: '4' },
  { label: '4353245', value: '5' },
];
const api = (
  keyword?: string,
  pageSize: number = 10,
  pageNumber: number = 1,
): Promise<{ data: typeof data; total: number }> => {
  return new Promise((resolve) => {
    const filtered = !keyword ? data : data.filter((item) => item.label.includes(keyword));
    setTimeout(() => {
      resolve({
        data: filtered.slice(pageSize * pageNumber, pageSize),
        total: filtered.length,
      });
    }, 300);
  });
};
const Demo = () => (
  <ProSelect
    search
    debounceTime={500}
    placeholder='输入关键词搜索'
    request={async ({ keyword, page, pageSize }) => {
      const res = await api(keyword, pageSize, page);
      return res;
    }}
  />
);

export default Demo;
