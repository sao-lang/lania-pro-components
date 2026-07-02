import { useProForm, ProForm } from '@lania-pro-components/components';

const schema = [
  {
    type: 'input',
    field: 'username',
    label: '用户名',
    required: true,
  },
  {
    type: 'password',
    field: 'password',
    label: '密码',
    required: true,
  },
];

export default () => {
  const { formInstance, Provider } = useProForm({
    schema,
    onSubmit: (values) => {
      console.log('登录信息:', values);
    },
  });

  return (
    <Provider>
      <div>
        <ProForm />
        <button onClick={() => formInstance?.validate()}>验证表单</button>
      </div>
    </Provider>
  );
};

