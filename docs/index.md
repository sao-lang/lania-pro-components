# Lania Pro Components

基于 Arco Design 的 Schema 驱动企业级组件库，提供开箱即用的表单、表格、弹窗等高级组件。

## 特性

- **Schema 驱动**: 通过 JSON Schema 定义表单和表格，无需手写大量代码
- **开箱即用**: 内置丰富的业务组件和场景化解决方案
- **TypeScript 支持**: 完整的类型定义和智能提示
- **高度可定制**: 支持自定义渲染和扩展

## 快速开始

```bash
pnpm add @lania-pro-components/components @arco-design/web-react
```

```tsx
import { ProForm } from '@lania-pro-components/components';
import '@arco-design/web-react/dist/css/arco.css';

const schema = [
  {
    type: 'input',
    field: 'name',
    label: '姓名',
    required: true,
  },
  {
    type: 'input',
    field: 'email',
    label: '邮箱',
    required: true,
  },
];

const App = () => (
  <ProForm schema={schema} onSubmit={(values) => console.log(values)} />
);
```

## 组件列表

- [ProForm](./components/pro-form) - Schema 驱动的表单组件
- [ProTable](./components/pro-table) - 企业级表格组件
- [ProDialog](./components/pro-dialog) - 弹窗组件
- [ProSelect](./components/pro-select) - 高级选择组件
- [ProUpload](./components/pro-upload) - 上传组件
- [ActionButton](./components/action-button) - 操作按钮组件

