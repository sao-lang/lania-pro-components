# ActionButton

操作按钮组件，提供新增、编辑、删除、查看等常用操作按钮。

## API

### 导出组件

| 组件 | 说明 |
| --- | --- |
| `AddButton` | 新增按钮 |
| `EditButton` | 编辑按钮 |
| `DeleteButton` | 删除按钮 |
| `ViewButton` | 查看按钮 |
| `BatchButton` | 批量操作按钮 |
| `ExportButton` | 导出按钮 |
| `ImportButton` | 导入按钮 |
| `JumpButton` | 跳转按钮 |

### ActionButtonProps

所有按钮组件共享的基础属性，继承自 `ButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `ReactNode` | - | 按钮文本 |
| `visible` | `boolean` | - | 是否显示 |

### FormButtonProps

表单类按钮（`AddButton`、`EditButton`）共享的属性。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | - | 弹窗标题 |
| `width` | `number \| string` | - | 弹窗宽度 |
| `schemas` | `ProFormSchema[]` | - | 表单字段配置 |
| `initialValues` | `Record<string, unknown>` | - | 表单初始值 |
| `formProps` | `Omit<ProFormProps, 'schemas' \| 'onFinish'>` | - | ProForm 属性 |
| `dialogProps` | `Omit<ProDialogProps, 'schemas' \| 'formProps' \| 'initialValues'>` | - | ProDialog 属性 |
| `onSubmit` | `(values: Record<string, unknown>) => Promise<boolean \| void> \| boolean \| void` | - | 表单提交回调，返回 `true` 自动关闭弹窗 |
| `onBeforeOpen` | `() => boolean \| void \| Promise<boolean \| void>` | - | 打开前回调，返回 `false` 阻止打开 |
| `onAfterClose` | `() => void` | - | 关闭后回调 |

### AddButtonProps

继承自 `FormButtonProps`。

### EditButtonProps

继承自 `FormButtonProps`，额外包含以下属性：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `getInitialValues` | `() => Record<string, unknown> \| Promise<Record<string, unknown>>` | - | 获取编辑初始值 |

### ViewButtonProps

继承自 `ActionButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | - | 弹窗标题 |
| `width` | `number \| string` | - | 弹窗宽度 |
| `dialogProps` | `Omit<ProDialogProps, 'children'>` | - | ProDialog 属性 |
| `renderContent` | `() => ReactNode` | - | 渲染查看内容 |
| `record` | `unknown` | - | 当前记录数据 |

### DeleteButtonProps

继承自 `ActionButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `confirmTitle` | `string` | - | 确认标题 |
| `confirmContent` | `ReactNode \| (() => ReactNode)` | - | 确认内容 |
| `okText` | `string` | - | 确认按钮文本 |
| `cancelText` | `string` | - | 取消按钮文本 |
| `okButtonProps` | `ActionButtonProps` | - | 确认按钮属性 |
| `dialogProps` | `Omit<ProDialogProps, 'onOk' \| 'onCancel'>` | - | ProDialog 属性 |
| `onDelete` | `() => Promise<boolean \| void> \| boolean \| void` | - | 删除回调，返回 `true` 自动关闭 |

### ExportButtonProps

继承自 `ActionButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `exportUrl` | `string` | - | 导出接口 URL |
| `params` | `Record<string, unknown>` | - | 导出参数 |
| `fileName` | `string` | - | 导出文件名 |
| `onExport` | `() => Promise<void> \| void` | - | 导出回调 |
| `onBeforeExport` | `() => boolean \| Promise<boolean>` | - | 导出前回调，返回 `false` 阻止导出 |
| `timeout` | `number` | - | 超时时间 |
| `headers` | `Record<string, string>` | - | 请求头 |

### ImportButtonProps

继承自 `ActionButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `uploadUrl` | `string` | - | 上传接口 URL |
| `uploadParams` | `Record<string, unknown>` | - | 上传参数 |
| `accept` | `string` | - | 接受的文件类型 |
| `multiple` | `boolean` | - | 是否支持多选 |
| `title` | `string` | - | 弹窗标题 |
| `width` | `number \| string` | - | 弹窗宽度 |
| `dialogProps` | `Omit<ProDialogProps, 'onOk'>` | - | ProDialog 属性 |
| `renderUpload` | `() => ReactNode` | - | 自定义上传区域 |
| `onSuccess` | `(result: unknown) => void` | - | 上传成功回调 |
| `onImportError` | `(error: Error) => void` | - | 上传失败回调 |

### JumpButtonProps

继承自 `ActionButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `to` | `string` | - | 跳转路径 |
| `target` | `'_blank' \| '_self'` | - | 跳转目标 |
| `onBeforeJump` | `() => boolean \| Promise<boolean>` | - | 跳转前回调，返回 `false` 阻止跳转 |

### BatchButtonProps

继承自 `ActionButtonProps`。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `selectedRows` | `unknown[]` | - | 选中行数据 |
| `selectedKeys` | `(string \| number)[]` | - | 选中行 keys |
| `needSelection` | `boolean` | - | 是否需要选中 |
| `minSelection` | `number` | - | 最小选中数量 |
| `maxSelection` | `number` | - | 最大选中数量 |
| `selectionWarning` | `string` | - | 选中数量警告 |
| `needConfirm` | `boolean` | - | 是否需要确认 |
| `confirmTitle` | `string` | - | 确认标题 |
| `confirmContent` | `ReactNode \| ((rows: unknown[]) => ReactNode)` | - | 确认内容 |
| `dialogProps` | `Omit<ProDialogProps, 'onOk'>` | - | ProDialog 属性 |
| `onAction` | `(rows: unknown[], keys: (string \| number)[]) => Promise<boolean \| void> \| boolean \| void` | - | 批量操作回调，返回 `true` 自动关闭 |

### Ref 方法

#### AddButtonRef

| 方法 | 说明 |
| --- | --- |
| `open()` | 打开弹窗 |

#### EditButtonRef

| 方法 | 说明 |
| --- | --- |
| `open()` | 打开弹窗 |
| `loading` | 加载状态 |

#### DeleteButtonRef

| 方法 | 说明 |
| --- | --- |
| `openConfirm()` | 打开确认弹窗 |
| `loading` | 加载状态 |

#### ViewButtonRef

| 方法 | 说明 |
| --- | --- |
| `open()` | 打开弹窗 |

#### BatchButtonRef

| 方法 | 说明 |
| --- | --- |
| `execute()` | 执行批量操作 |
| `loading` | 加载状态 |

#### ExportButtonRef

| 方法 | 说明 |
| --- | --- |
| `export()` | 执行导出 |
| `loading` | 加载状态 |

#### ImportButtonRef

| 方法 | 说明 |
| --- | --- |
| `open()` | 打开弹窗 |
| `loading` | 加载状态 |

#### JumpButtonRef

| 方法 | 说明 |
| --- | --- |
| `jump()` | 执行跳转 |

## 基本用法

<ReactWrapper :component="ActionButtonDemo1" />

点击按钮会触发对应的内置交互：`AddButton`/`EditButton` 打开表单弹窗，`DeleteButton` 弹出二次确认，`ViewButton` 打开详情弹窗。即使传入 `onClick`，也只是作为点击事件的附加回调（用于埋点/日志），不会覆盖按钮内置的弹窗行为；业务逻辑请使用组件提供的回调属性（`onSubmit`、`onDelete` 等）。

```tsx
import { AddButton, EditButton, DeleteButton, ViewButton } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const currentRecord = { id: 1, name: '张三', email: 'zhangsan@example.com' };

const userSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
  { name: 'email', label: '邮箱', component: 'Input', required: true },
];

const Demo = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <AddButton
      title="新增用户"
      schemas={userSchemas}
      onSubmit={async (values) => {
        Message.success(`新增成功：${values.name}`);
        return true; // 返回 true 自动关闭弹窗
      }}
    />
    <EditButton
      title="编辑用户"
      schemas={userSchemas}
      getInitialValues={() => currentRecord}
      onSubmit={async (values) => {
        Message.success(`编辑成功：${values.name}`);
        return true;
      }}
    />
    <DeleteButton
      onDelete={async () => {
        Message.success('删除成功');
        return true;
      }}
    />
    <ViewButton
      title="用户详情"
      renderContent={() => (
        <div>
          <p>姓名：{currentRecord.name}</p>
          <p>邮箱：{currentRecord.email}</p>
        </div>
      )}
    />
  </div>
);
```

## 批量操作

<ReactWrapper :component="ActionButtonDemo2" />

`BatchButton` 需要传入 `selectedRows` 和 `selectedKeys`，可配合 `needConfirm` 进行二次确认；`ExportButton` 通过 `onExport` 自定义导出逻辑；`ImportButton` 点击后弹出上传弹窗。

```tsx
import { BatchButton, ExportButton, ImportButton } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const selectedRows = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
];
const selectedKeys = [1, 2];

const Demo = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <BatchButton
      text="批量删除"
      status="danger"
      selectedRows={selectedRows}
      selectedKeys={selectedKeys}
      needConfirm
      confirmTitle="确认批量删除"
      confirmContent={(rows) => `确定要删除选中的 ${rows.length} 条数据吗？`}
      onAction={async (rows) => {
        Message.success(`已删除 ${rows.length} 条数据`);
        return true;
      }}
    />
    <ExportButton
      onExport={() => {
        Message.success('导出成功');
      }}
    />
    <ImportButton title="导入数据" uploadUrl="/api/users/import" />
  </div>
);
```

## 跳转按钮

<ReactWrapper :component="ActionButtonDemo3" />

`JumpButton` 通过 `to` 指定跳转路径（注意不是 `href`），`target="_blank"` 在新标签页打开。`onBeforeJump` 返回 `false` 可拦截跳转。

```tsx
import { JumpButton } from '@lania-pro-components/components';
import { Message } from '@arco-design/web-react';

const Demo = () => (
  <div style={{ display: 'flex', gap: '8px' }}>
    <JumpButton
      text="跳转新页面"
      to="https://github.com"
      target="_blank"
      onBeforeJump={() => {
        Message.info('即将在新标签页打开');
        return true;
      }}
    />
    <JumpButton
      text="拦截跳转"
      to="/detail"
      onBeforeJump={() => {
        Message.warning('已通过 onBeforeJump 拦截跳转');
        return false;
      }}
    />
  </div>
);
```

## 新增按钮 AddButton

<ReactWrapper :component="ActionButtonDemo4" />

使用 `schemas` 配置表单字段，`onSubmit` 处理提交逻辑，返回 `true` 自动关闭弹窗。支持 `onBeforeOpen`（打开前回调）、`onAfterClose`（关闭后回调）、`initialValues`（初始值）、`formProps` / `dialogProps`（透传配置）。通过 `ref` 可调用 `open()` 手动打开弹窗。

```tsx
import { useRef, useState } from 'react';
import { AddButton, type AddButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const userSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
  { name: 'email', label: '邮箱', component: 'Input', required: true },
  {
    name: 'gender',
    label: '性别',
    component: 'Select',
    componentProps: {
      options: [
        { value: 'male', label: '男' },
        { value: 'female', label: '女' },
      ],
    },
  },
  { name: 'age', label: '年龄', component: 'InputNumber' },
];

const Demo = () => {
  const addButtonRef = useRef<AddButtonRef>(null);
  const [count, setCount] = useState(0);

  return (
    <Space>
      <AddButton
        ref={addButtonRef}
        text="新增用户"
        type="primary"
        title="新增用户"
        width={600}
        schemas={userSchemas}
        initialValues={{ gender: 'male' }}
        onBeforeOpen={() => {
          Message.info('打开前回调');
          return true;
        }}
        onSubmit={async (values) => {
          await new Promise((r) => setTimeout(r, 800));
          setCount((c) => c + 1);
          Message.success(`新增成功：${values.name}`);
          return true;
        }}
        onAfterClose={() => Message.info('弹窗已关闭')}
      />
      <Button onClick={() => addButtonRef.current?.open()}>通过 ref 打开</Button>
    </Space>
  );
};
```

## 编辑按钮 EditButton

<ReactWrapper :component="ActionButtonDemo5" />

`EditButton` 与 `AddButton` 类似，不同点是通过 `getInitialValues` 异步获取编辑初始值。通过 `ref` 可调用 `open()` 并读取 `loading` 状态。

```tsx
import { useRef, useState } from 'react';
import { EditButton, type EditButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const userSchemas = [
  { name: 'name', label: '姓名', component: 'Input', required: true },
  { name: 'email', label: '邮箱', component: 'Input', required: true },
  {
    name: 'role',
    label: '角色',
    component: 'Select',
    componentProps: {
      options: [
        { value: 'admin', label: '管理员' },
        { value: 'user', label: '普通用户' },
      ],
    },
  },
];

const Demo = () => {
  const editRef = useRef<EditButtonRef>(null);
  const [record, setRecord] = useState({ id: 1, name: '张三', email: 'a@b.com', role: 'admin' });

  return (
    <Space>
      <EditButton
        ref={editRef}
        text="编辑"
        title="编辑用户"
        schemas={userSchemas}
        getInitialValues={async () => {
          await new Promise((r) => setTimeout(r, 500));
          return record;
        }}
        onBeforeOpen={() => {
          Message.info('加载数据中...');
          return true;
        }}
        onSubmit={async (values) => {
          await new Promise((r) => setTimeout(r, 800));
          setRecord((prev) => ({ ...prev, ...values }));
          Message.success('编辑成功');
          return true;
        }}
      />
      <Button onClick={() => editRef.current?.open()}>通过 ref 打开</Button>
    </Space>
  );
};
```

## 删除按钮 DeleteButton

<ReactWrapper :component="ActionButtonDemo6" />

点击后弹出二次确认弹窗，可自定义 `confirmTitle`、`confirmContent`、`okText`、`cancelText`、`okButtonProps`。`onDelete` 返回 `true` 自动关闭。通过 `ref` 可调用 `openConfirm()` 并读取 `loading`。

```tsx
import { useRef, useState } from 'react';
import { DeleteButton, type DeleteButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const Demo = () => {
  const deleteRef = useRef<DeleteButtonRef>(null);
  const [deleted, setDeleted] = useState(false);

  return (
    <Space>
      <DeleteButton
        ref={deleteRef}
        text="删除"
        type="primary"
        status="danger"
        confirmTitle="确认删除"
        confirmContent="确定要删除这条数据吗？删除后无法恢复。"
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ status: 'danger' }}
        onDelete={async () => {
          await new Promise((r) => setTimeout(r, 800));
          setDeleted(true);
          Message.success('删除成功');
          return true;
        }}
      />
      <Button onClick={() => deleteRef.current?.openConfirm()}>通过 ref 触发</Button>
    </Space>
  );
};
```

## 查看按钮 ViewButton

<ReactWrapper :component="ActionButtonDemo7" />

点击后弹出详情弹窗，通过 `renderContent` 自定义查看内容，支持 `width`、`dialogProps` 等配置。通过 `ref` 可调用 `open()` 手动打开。

```tsx
import { useRef } from 'react';
import { ViewButton, type ViewButtonRef } from '@lania-pro-components/components';
import { Button, Descriptions, Tag, Space } from '@arco-design/web-react';

const record = {
  name: '张三',
  email: 'zhangsan@example.com',
  role: '管理员',
  status: 'active',
  createTime: '2024-01-15 10:30:00',
};

const Demo = () => {
  const viewRef = useRef<ViewButtonRef>(null);

  return (
    <Space>
      <ViewButton
        ref={viewRef}
        text="查看详情"
        type="text"
        title="用户详情"
        width={700}
        renderContent={() => (
          <Descriptions
            column={2}
            data={[
              { label: '姓名', value: record.name },
              { label: '邮箱', value: record.email },
              { label: '角色', value: record.role },
              {
                label: '状态',
                value: <Tag color="green">{record.status === 'active' ? '启用' : '禁用'}</Tag>,
              },
              { label: '创建时间', value: record.createTime },
            ]}
          />
        )}
      />
      <Button onClick={() => viewRef.current?.open()}>通过 ref 打开</Button>
    </Space>
  );
};
```

## 批量操作 BatchButton

<ReactWrapper :component="ActionButtonDemo8" />

支持选中数量校验（`needSelection`、`minSelection`、`maxSelection`）、二次确认（`needConfirm`、`confirmTitle`、`confirmContent`）。`onAction` 接收选中的行数据和 keys。通过 `ref` 可调用 `execute()` 并读取 `loading`。

```tsx
import { useRef, useState } from 'react';
import { BatchButton, type BatchButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space, Table } from '@arco-design/web-react';

interface Row { id: number; name: string; email: string }
const data: Row[] = [
  { id: 1, name: '张三', email: 'a@b.com' },
  { id: 2, name: '李四', email: 'c@d.com' },
  { id: 3, name: '王五', email: 'e@f.com' },
];

const Demo = () => {
  const batchRef = useRef<BatchButtonRef>(null);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([1, 2]);
  const [selectedRows, setSelectedRows] = useState<Row[]>(
    data.filter((r) => selectedKeys.includes(r.id))
  );
  const [list, setList] = useState(data);

  const handleSelectionChange = (keys: (string | number)[]) => {
    const numKeys = keys.map(Number);
    setSelectedKeys(numKeys);
    setSelectedRows(list.filter((r) => numKeys.includes(r.id)));
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <BatchButton
          ref={batchRef}
          text="批量删除"
          status="danger"
          selectedRows={selectedRows}
          selectedKeys={selectedKeys}
          needSelection
          minSelection={1}
          maxSelection={3}
          needConfirm
          confirmTitle="确认批量删除"
          confirmContent={(rows) => `确定要删除选中的 ${(rows as Row[]).length} 条数据吗？`}
          onAction={async (rows) => {
            await new Promise((r) => setTimeout(r, 800));
            const ids = (rows as Row[]).map((r) => r.id);
            setList((prev) => prev.filter((r) => !ids.includes(r.id)));
            setSelectedKeys([]);
            setSelectedRows([]);
            Message.success(`已删除 ${rows.length} 条`);
            return true;
          }}
        />
        <BatchButton
          text="批量启用"
          selectedRows={selectedRows}
          selectedKeys={selectedKeys}
          needSelection
          onAction={async (rows) => {
            Message.success(`已启用 ${rows.length} 条`);
            return true;
          }}
        />
        <Button onClick={() => batchRef.current?.execute()}>通过 ref 触发</Button>
      </Space>
      <Table
        size="small"
        rowKey="id"
        data={list}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '姓名', dataIndex: 'name' },
          { title: '邮箱', dataIndex: 'email' },
        ]}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedKeys,
          onChange: handleSelectionChange,
        }}
        pagination={false}
      />
    </div>
  );
};
```

## 导出按钮 ExportButton

<ReactWrapper :component="ActionButtonDemo9" />

两种用法：通过 `onExport` 自定义导出逻辑，或通过 `exportUrl` / `params` / `fileName` 走内置下载。支持 `onBeforeExport` 导出前拦截（返回 `false` 阻止）。通过 `ref` 可调用 `export()` 并读取 `loading`。

```tsx
import { useRef, useState } from 'react';
import { ExportButton, type ExportButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const Demo = () => {
  const exportRef = useRef<ExportButtonRef>(null);
  const [count, setCount] = useState(0);

  return (
    <Space direction="vertical">
      <Space>
        <ExportButton
          ref={exportRef}
          text="导出数据"
          type="primary"
          onBeforeExport={() => {
            Message.info('即将开始导出...');
            return true;
          }}
          onExport={async () => {
            await new Promise((r) => setTimeout(r, 1500));
            setCount((c) => c + 1);
            Message.success('导出成功');
          }}
        />
        <ExportButton
          text="导出Excel"
          exportUrl="/api/users/export"
          params={{ status: 'active' }}
          fileName="用户列表.xlsx"
        />
        <Button onClick={() => exportRef.current?.export()}>通过 ref 触发</Button>
      </Space>
      <div>导出次数：{count}</div>
    </Space>
  );
};
```

## 导入按钮 ImportButton

<ReactWrapper :component="ActionButtonDemo10" />

点击后弹出上传弹窗，支持 `uploadUrl`、`uploadParams`、`accept`、`multiple`、`onSuccess`、`onImportError` 等配置。通过 `ref` 可调用 `open()` 并读取 `loading`。

```tsx
import { useRef, useState } from 'react';
import { ImportButton, type ImportButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const Demo = () => {
  const importRef = useRef<ImportButtonRef>(null);
  const [count, setCount] = useState(0);

  return (
    <Space direction="vertical">
      <Space>
        <ImportButton
          ref={importRef}
          text="导入用户"
          type="primary"
          title="批量导入用户"
          width={500}
          uploadUrl="/api/users/import"
          uploadParams={{ type: 'user' }}
          accept=".xlsx,.xls,.csv"
          multiple
          onSuccess={(result) => {
            setCount((c) => c + 1);
            Message.success('导入成功');
            console.log(result);
          }}
          onImportError={(error) => {
            Message.error(`导入失败：${error.message}`);
          }}
        />
        <Button onClick={() => importRef.current?.open()}>通过 ref 打开</Button>
      </Space>
      <div>成功导入次数：{count}</div>
    </Space>
  );
};
```

## 跳转按钮 JumpButton（完整示例）

<ReactWrapper :component="ActionButtonDemo11" />

`to` 指定目标路径，`target` 控制打开方式，`onBeforeJump` 返回 `false` 可拦截跳转。通过 `ref` 可调用 `jump()` 手动触发。

```tsx
import { useRef } from 'react';
import { JumpButton, type JumpButtonRef } from '@lania-pro-components/components';
import { Button, Message, Space } from '@arco-design/web-react';

const Demo = () => {
  const jumpRef = useRef<JumpButtonRef>(null);

  return (
    <Space direction="vertical">
      <Space>
        <JumpButton
          text="新标签页打开"
          to="https://github.com"
          target="_blank"
          onBeforeJump={() => {
            Message.info('即将跳转');
            return true;
          }}
        />
        <JumpButton
          text="拦截跳转"
          to="/detail"
          onBeforeJump={() => {
            Message.warning('已拦截');
            return false;
          }}
        />
        <Button onClick={() => jumpRef.current?.jump()}>通过 ref 跳转</Button>
      </Space>
      <JumpButton ref={jumpRef} text="ref 绑定的跳转" to="https://www.npmjs.com" target="_blank" />
    </Space>
  );
};
```

<script setup lang="ts">
import ReactWrapper from '../.vitepress/theme/ReactWrapper.vue';
import ActionButtonDemo1 from '../examples/action-button/demo1';
import ActionButtonDemo2 from '../examples/action-button/demo2';
import ActionButtonDemo3 from '../examples/action-button/demo3';
import ActionButtonDemo4 from '../examples/action-button/demo4';
import ActionButtonDemo5 from '../examples/action-button/demo5';
import ActionButtonDemo6 from '../examples/action-button/demo6';
import ActionButtonDemo7 from '../examples/action-button/demo7';
import ActionButtonDemo8 from '../examples/action-button/demo8';
import ActionButtonDemo9 from '../examples/action-button/demo9';
import ActionButtonDemo10 from '../examples/action-button/demo10';
import ActionButtonDemo11 from '../examples/action-button/demo11';
</script>

