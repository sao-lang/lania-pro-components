/**
 * ThemeContext — 主题上下文对象
 *
 * 分离 Context 创建到单独文件，使 useTheme hook 可以不依赖 ThemeProvider 组件。
 */

import { createContext } from 'react';
import type { ThemeContextValue } from './types';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
