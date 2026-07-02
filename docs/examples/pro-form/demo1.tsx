import { ProForm } from '@lania-pro-components/components';

const schema = [
  {
    type: 'input',
    field: 'name',
    label: '姓名',
    required: true,
    placeholder: '请输入姓名',
  },
  {
    type: 'input',
    field: 'email',
    label: '邮箱',
    required: true,
    placeholder: '请输入邮箱',
  },
  {
    type: 'select',
    field: 'gender',
    label: '性别',
    required: true,
    options: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' },
    ],
  },
];

export default () => (
  <ProForm
    schema={schema}
    onSubmit={(values) => {
      console.log('表单值:', values);
    }}
  />
);

