/**
 * 组件注册表
 *
 * 提供表单组件的注册与查找机制，支持动态扩展表单控件。
 *
 * 快捷组件语法（parseQuickComponent）：
 * - "${Input}元" → 带后缀"元"的 Input
 * - "￥${InputNumber}" → 带前缀"￥"的 InputNumber
 * - "QuickName" → 已注册的快捷组件配置
 *
 * 这种语法使 Schema 中的 component 字段可以简洁地表达带前缀/后缀的组件，
 * 而无需指定完整的 componentProps。
 */
import React from 'react';
import type { ComponentRegistry, ProFormFieldComponentProps, QuickComponentConfig } from '../types';

/**
 * 组件注册表
 */
const componentRegistry: ComponentRegistry = {};

/**
 * 快速组件配置表
 */
const quickComponentConfigs: Record<string, QuickComponentConfig> = {};

/**
 * 注册组件
 *
 * @param name 组件名称
 * @param component 组件（props 应匹配 ProFormFieldComponentProps；可指定 TValue 泛型明确 value 类型）
 */
export function registerComponent<TValue = unknown>(
  name: string,
  component: React.ComponentType<ProFormFieldComponentProps<TValue>>,
): void {
  componentRegistry[name] = component as React.ComponentType<ProFormFieldComponentProps>;
}

/**
 * 批量注册组件
 * @param components 组件映射
 */
export function registerComponents(components: ComponentRegistry): void {
  Object.entries(components).forEach(([name, component]) => {
    componentRegistry[name] = component;
  });
}

/**
 * 注册快速组件
 * @param name 组件名称
 * @param config 组件配置
 */
export function registerQuickComponent(name: string, config: QuickComponentConfig): void {
  quickComponentConfigs[name] = config;
}

/**
 * 获取组件
 * @param name 组件名称
 * @returns 组件
 */
export function getComponent(name: string): React.ComponentType<ProFormFieldComponentProps> | undefined {
  return componentRegistry[name];
}

/**
 * 获取快速组件配置
 * @param name 组件名称
 * @returns 组件配置
 */
export function getQuickComponentConfig(name: string): QuickComponentConfig | undefined {
  return quickComponentConfigs[name];
}

/**
 * 检查组件是否已注册
 * @param name 组件名称
 * @returns 是否已注册
 */
export function hasComponent(name: string): boolean {
  return name in componentRegistry;
}

/**
 * 获取所有已注册的组件名称
 * @returns 组件名称列表
 */
export function getRegisteredComponentNames(): string[] {
  return Object.keys(componentRegistry);
}

/**
 * 解析快速组件
 * 支持的语法：
 * - ${Input}元 - 带后缀的输入框
 * - ￥${Input} - 带前缀的输入框
 * - QuickName - 注册的快速组件
 */
export function parseQuickComponent(
  componentName: string,
):
  | { type: 'normal'; name: string }
  | { type: 'unit'; baseComponent: string; suffix: string; name: string }
  | { type: 'prefix'; baseComponent: string; prefix: string; name: string }
  | { type: 'quick'; config: QuickComponentConfig; name: string } {
  // 检查是否是注册的快速组件
  if (quickComponentConfigs[componentName]) {
    return {
      type: 'quick',
      config: quickComponentConfigs[componentName],
      name: componentName,
    };
  }

  // 匹配 ${Component}后缀 格式
  const unitPattern = /^\$\{(InputNumber|Input)\}(.+)$/;
  const unitMatch = componentName.match(unitPattern);
  if (unitMatch) {
    return {
      type: 'unit',
      baseComponent: unitMatch[1],
      suffix: unitMatch[2],
      name: componentName,
    };
  }

  // 匹配 前缀${Component} 格式
  const prefixPattern = /^(.+)\$\{(InputNumber|Input)\}$/;
  const prefixMatch = componentName.match(prefixPattern);
  if (prefixMatch) {
    return {
      type: 'prefix',
      baseComponent: prefixMatch[2],
      prefix: prefixMatch[1],
      name: componentName,
    };
  }

  // 普通组件
  return { type: 'normal', name: componentName };
}

/**
 * 清空注册表
 */
export function clearComponentRegistry(): void {
  Object.keys(componentRegistry).forEach((key) => {
    delete componentRegistry[key];
  });
}

/**
 * 高阶函数：包装组件以剥离 FormField 注入的控制 props
 *
 * FormField 在编辑态渲染时会向组件注入 value/onChange/status/values/schema/field/form/onFocus/onBlur 等 props。
 * 原生组件（如 Arco 组件）只需要 value/onChange 等数据 props，不需要 status/values/schema/field/form 等控制 props。
 * 本函数剥离这些控制 props，避免它们被透传到 DOM 导致 React 警告。
 *
 * 自定义表单控件如需消费这些控制 props，可直接按 ProFormFieldComponentProps 定义组件 props，无需包装。
 */
export function stripFormControlProps<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
): React.ComponentType<ProFormFieldComponentProps> {
  const Wrapped = (props: ProFormFieldComponentProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _s, values: _v, schema: _sc, field: _f, form: _fm, ...rest } = props;
    return React.createElement(Component, rest as unknown as P);
  };
  Wrapped.displayName = `FormFieldWrapped(${Component.displayName || Component.name || 'Unknown'})`;
  return Wrapped as React.ComponentType<ProFormFieldComponentProps>;
}

// 导出注册表供外部访问
export { componentRegistry, quickComponentConfigs };
