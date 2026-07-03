import { ProSelect } from '@lania-pro-components/components';
import { useState } from 'react';

const Demo = () => {
  const [, setValue] = useState<(string | number)[]>([]);

  return (
    <ProSelect
      mode='multiple'
      allowCreate
      options={[
        { label: '选项 A', value: 'a' },
        { label: '选项 B', value: 'b' },
      ]}
      placeholder='输入并创建新选项'
      onChange={setValue}
    />
  );
};

export default Demo;
