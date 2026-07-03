# Theme

主题包，提供 light（明亮）和 dark（暗黑）两种主题的设计令牌（Design Tokens），支持 system 跟随系统模式。

## API

### 导出

| 导出               | 类型 | 说明                                 |
| ------------------ | ---- | ------------------------------------ |
| `ThemeProvider`    | 组件 | 主题提供者，管理全局主题状态         |
| `useTheme`         | Hook | 在组件中获取主题上下文               |
| `lightTheme`       | 对象 | 明亮主题设计令牌（~90 个原子级令牌） |
| `darkTheme`        | 对象 | 暗黑主题设计令牌                     |
| `cssVar`           | 函数 | 类型安全的 CSS 变量名生成器          |
| `cssVarRef`        | 函数 | CSS `var()` 引用辅助                 |
| `createLightTheme` | 函数 | 基于 light 创建自定义主题            |
| `createDarkTheme`  | 函数 | 基于 dark 创建自定义主题             |

### ThemeProviderProps

| 属性            | 类型                             | 默认值              | 说明                     |
| --------------- | -------------------------------- | ------------------- | ------------------------ |
| `children`      | `ReactNode`                      | -                   | 子节点（通常是整个应用） |
| `initialTheme`  | `ThemeType`                      | `'system'`          | 初始主题                 |
| `storageKey`    | `string`                         | `'lania-pro-theme'` | localStorage 存储键名    |
| `onThemeChange` | `(theme, resolvedTheme) => void` | -                   | 主题变化回调             |

### ThemeType

```ts
type ThemeType = 'light' | 'dark' | 'system';
```

### useTheme 返回值

| 属性             | 类型                         | 说明             |
| ---------------- | ---------------------------- | ---------------- |
| `theme`          | `ThemeType`                  | 当前主题设置     |
| `resolvedTheme`  | `'light' \| 'dark'`          | 解析后的实际主题 |
| `setTheme`       | `(theme: ThemeType) => void` | 设置指定主题     |
| `toggleTheme`    | `() => void`                 | 切换明暗主题     |
| `setLightTheme`  | `() => void`                 | 设置为明亮主题   |
| `setDarkTheme`   | `() => void`                 | 设置为暗黑主题   |
| `setSystemTheme` | `() => void`                 | 设置为跟随系统   |

### 设计令牌分类

| 分类   | 变量数 | 前缀                                              |
| ------ | ------ | ------------------------------------------------- |
| 背景色 | 4      | `--color-bg-*`                                    |
| 文字色 | 4      | `--color-text-*`                                  |
| 边框色 | 3      | `--color-border-*`                                |
| 功能色 | 26     | `--color-{primary/success/warning/danger/info}-*` |
| 扩展色 | 12     | `--color-{link/mask/disabled/row/highlight}-*`    |
| 字体   | 11     | `--font-*`                                        |
| 间距   | 6      | `--spacing-*`                                     |
| 圆角   | 5      | `--radius-*`                                      |
| 阴影   | 9      | `--shadow-*`                                      |
| 透明度 | 5      | `--opacity-*`                                     |
| 层级   | 6      | `--z-*`                                           |
| 过渡   | 4      | `--transition-*`                                  |

### cssVar / cssVarRef

```ts
cssVar('color', 'bg', 1); // → '--color-bg-1'
cssVar('fontSize', 'base'); // → '--font-size-base'
cssVarRef('color', 'primary'); // → 'var(--color-primary)'
```

## 示例

```tsx
// 1. 应用入口包裹 ThemeProvider
import { ThemeProvider } from '@lania-pro-components/theme';
import '@lania-pro-components/theme/light.css';
import '@lania-pro-components/theme/dark.css';

<ThemeProvider initialTheme='system'>
  <App />
</ThemeProvider>;

// 2. 组件中使用
import { useTheme, cssVarRef } from '@lania-pro-components/theme';

function MyComponent() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <div style={{ background: cssVarRef('color', 'bg', 1) }}>
      <span>当前主题: {resolvedTheme}</span>
      <button onClick={toggleTheme}>切换</button>
    </div>
  );
}

// 3. 自定义主题
import { createLightTheme } from '@lania-pro-components/theme';
const myTheme = createLightTheme({
  color: { primary: '#7c3aed', primaryHover: '#8b5cf6' },
});
```
