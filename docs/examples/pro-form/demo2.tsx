import { useProForm, ProForm } from '@lania-pro-components/components';

const schema = [
  {
    type: 'input',
    name: 'username',
    label: '用户名',
    required: true,
  },
  {
    type: 'password',
    name: 'password',
    label: '密码',
    required: true,
  },
];

export const Demo2 = () => {
  const { instance, Provider } = useProForm({
    schemas: schema,
    onFinish: (values) => {
      console.log('登录信息:', values);
    },
  });

  return (
    <Provider>
      <div>
        <ProForm />
        <button onClick={() => instance?.validate()}>验证表单</button>
      </div>
    </Provider>
  );
};

export default Demo2;
