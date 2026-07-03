/**
 * cssVar — 类型安全的 CSS 变量名生成器
 *
 * 将设计令牌路径转为 CSS 自定义属性名称。
 * 防止 CSS 变量名拼写错误，提供 IDE 自动补全。
 *
 * @example
 * ```tsx
 * cssVar('color', 'bg', 1)      // '--color-bg-1'
 * cssVar('fontSize', 'base')     // '--font-size-base'
 * cssVar('spacing', 'md')        // '--spacing-md'
 * cssVar('radius', 'lg')         // '--radius-lg'
 * cssVar('shadow', 'md')         // '--shadow-md'
 * ```
 */

type TokenPath =
  | ['color', 'bg', 1 | 2 | 3 | 4]
  | ['color', 'text', 1 | 2 | 3 | 4]
  | ['color', 'border', 1 | 2 | 3]
  | ['color', 'primary' | 'primaryHover' | 'primaryActive' | 'primaryLight']
  | ['color', 'success' | 'successHover' | 'successActive' | 'successLight' | 'successBorder']
  | ['color', 'warning' | 'warningHover' | 'warningActive' | 'warningLight' | 'warningBorder']
  | ['color', 'danger' | 'dangerHover' | 'dangerActive' | 'dangerLight' | 'dangerBorder']
  | ['color', 'info' | 'infoLight']
  | ['color', 'link' | 'linkHover' | 'linkActive']
  | ['color', 'mask']
  | ['color', 'disabledBg' | 'disabledText' | 'disabledBorder']
  | ['color', 'rowHover' | 'rowSelected' | 'rowStriped']
  | ['color', 'highlight']
  | ['fontSize', 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'xxl']
  | ['fontFamily', 'base' | 'code' | 'numeric']
  | ['fontWeight', 'regular' | 'medium' | 'semibold' | 'bold']
  | ['lineHeight', 'tight' | 'base' | 'loose']
  | ['spacing', 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl']
  | ['radius', 'sm' | 'md' | 'lg' | 'xl' | 'full']
  | ['shadow', 'sm' | 'md' | 'lg' | 'xl' | 'dropdown' | 'drawer' | 'modal' | 'card' | 'none']
  | ['opacity', 'disabled' | 'loading' | 'mask' | 'secondary' | 'placeholder']
  | ['zIndex', 'dropdown' | 'sticky' | 'drawer' | 'modal' | 'message' | 'tooltip']
  | ['transition', 'durationFast' | 'durationNormal' | 'durationSlow' | 'timingFunction']
  | ['breakpoint', 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'];

/**
 * 将驼峰命名转为连字符命名
 */
function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * 生成 CSS 自定义属性名
 */
export function cssVar(...path: TokenPath): string {
  const parts = path.map((seg) => (typeof seg === 'number' ? String(seg) : kebabCase(seg)));
  return `--${parts.join('-')}`;
}

/**
 * 在 CSS-in-JS 中引用 CSS 变量值的辅助函数
 *
 * @example
 * ```tsx
 * const style = { color: cssVarRef('color', 'primary') }
 * // → { color: 'var(--color-primary)' }
 * ```
 */
export function cssVarRef(...path: TokenPath): string {
  return `var(${cssVar(...path)})`;
}
