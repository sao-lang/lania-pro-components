import { ProSelect } from '@lania-pro-components/components';

export default () => (
  <ProSelect
    remote
    placeholder="输入关键词搜索"
    onSearch={(keyword) =>
      Promise.resolve([
        { value: '1', label: `搜索结果: ${keyword}` },
      ])
    }
  />
);

