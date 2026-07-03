import { ProSelect } from '@lania-pro-components/components';
import { useState } from 'react';

const Demo = () => {
  const [, setValue] = useState<string | number | undefined>();

  return (
    <ProSelect
      options={new Array(500).map((_, index: number) => ({ label: `虚拟滚动${index + 1}`, value: index }))}
      virtual
      virtualHeight={200}
      placeholder='虚拟滚动示例'
      onChange={setValue}
    />
  );
};

export default Demo;
