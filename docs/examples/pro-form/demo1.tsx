import { ProForm } from '@lania-pro-components/components';

const schema = [
  {
    type: 'input',
    name: 'name',
    label: '姓名',
    required: true,
    placeholder: '请输入姓名',
  },
  {
    type: 'input',
    name: 'email',
    label: '邮箱',
    required: true,
    placeholder: '请输入邮箱',
  },
  {
    type: 'select',
    name: 'gender',
    label: '性别',
    required: true,
    options: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' },
    ],
  },
];

export const Demo1 = () => (
  <ProForm
    schemas={schema}
    onFinish={(values) => {
      console.log('表单值:', values);
    }}
  />
);

export default Demo1;
