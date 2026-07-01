import { ProForm } from './ProForm';
import { useProForm } from './useProForm';

export const ProFormExample = () => {
  const { Provider } = useProForm();
  return (
    <Provider>
      <ProForm />
    </Provider>
  );
};
