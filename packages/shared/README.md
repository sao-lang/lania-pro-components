# @lania-pro-components/shared

> React 抽象底座包 — 跨组件复用的 Hooks、组件、工厂函数、类型定义

## 定位

本包是 Lania Pro Components 的 **React 抽象底座层**，位于 `utils`（纯函数底座，零 React 依赖）之上、`components`（业务组件）之下。

- **utils 包**：纯函数/类，零 React/Arco 依赖（如 `reactive`、`debounce`、`LRUCache`）
- **shared 包**：React 感知但 Arco 解耦的抽象（如 `useVirtualScroll`、`PerformanceMonitor`、`createProProvider`）
- **components 包**：具体业务组件（如 `ProTable`、`ProForm`），消费 shared 和 utils

## 安装

```bash
pnpm add @lania-pro-components/shared
```

## 使用

```tsx
import { useVirtualScroll, PerformanceMonitor } from '@lania-pro-components/shared';

// 或按子路径导入
import { useCache } from '@lania-pro-components/shared/hooks';
import { PerformanceMonitor } from '@lania-pro-components/shared/PerformanceMonitor';
```

## 包含内容

### Hooks

- `useVirtualScroll` / `useDynamicVirtualScroll` — 虚拟滚动
- `useAsyncRequest` — 远程请求（含拦截器、缓存、取消、轮询）
- `useCache` — LFU+LRU 混合缓存
- `useResponsive` — 响应式断点检测
- `useUrlSync` — URL 双向同步
- `usePresetManager` — 预设管理（原 useSearchSchema）
- `usePersistedState` — 持久化状态
- `useChartInstance` — 图表实例生命周期
- `useResizeObserver` — Resize 监听

### 组件

- `PerformanceMonitor` — 性能监控浮窗

### 工厂函数

- `createProProvider` — Provider 工厂
- `createImperativeInstance` — 命令式实例工厂
- `useActionButton` — ActionButton 工厂 hook

### 类型

- `VirtualScrollConfig` — 虚拟滚动配置
- `LazyLoadConfig` — 懒加载配置
- `BatchUpdateConfig` — 批量更新配置
- `PerformanceConfig` — 性能配置聚合
- `ComponentStatus` — 组件状态枚举
- `CardContainerConfig` — 卡片容器配置
- `AsyncDataConfig` — 异步数据配置

## 开发

```bash
# 构建
pnpm build

# 类型检查
pnpm typecheck
```
