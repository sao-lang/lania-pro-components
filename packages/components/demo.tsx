/* eslint-disable prettier/prettier */
import { ProTable, useProTable } from './ProTable';

const Demo = () => {
  const { bindingProps } = useProTable({ columns: [] });

  return (
    <>
      <ProTable {...bindingProps} />
    </>
  );
};

export default Demo;
