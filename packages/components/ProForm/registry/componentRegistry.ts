import React from 'react';
import type { ComponentRegistry, QuickComponentConfig } from '../types';

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
 * @param name 组件名称
 * @param component 组件
 */
export function registerComponent(name: string, component: React.ComponentType<any>): void {
  componentRegistry[name] = component;
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
export function getComponent(name: string): React.ComponentType<any> | undefined {
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

// 导出注册表供外部访问
export { componentRegistry, quickComponentConfigs };
