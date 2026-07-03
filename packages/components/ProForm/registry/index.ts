/**
 * ProForm 注册表模块
 *
 * 提供可插拔的组件注册系统，支持动态扩展表单组件能力：
 *
 * 1. 组件注册（componentRegistry）
 *    - registerComponent(name, Component): 注册表单控件组件
 *    - getComponent(name): 获取已注册的组件
 *    - parseQuickComponent(name): 解析快捷组件语法
 *      支持 ${Input}元（带后缀）、￥${Input}（带前缀）、QuickName（已注册快捷组件）
 *
 * 2. 只读渲染器注册（readonlyRegistry / rendererRegistry）
 *    - registerReadonlyRenderer(componentType, renderer): 注册字段的只读/预览渲染器
 *    - getReadonlyRenderer(componentType): 获取指定组件的只读渲染器
 *    - getRendererByMode(mode): 根据渲染模式（text/json/date/image 等）获取渲染器
 *    - 内置 20+ 种默认渲染器（text/date/number/currency/image/video/link 等）
 */
export {
  registerComponent,
  registerComponents,
  registerQuickComponent,
  getComponent,
  getQuickComponentConfig,
  hasComponent,
  getRegisteredComponentNames,
  parseQuickComponent,
  clearComponentRegistry,
  componentRegistry,
  quickComponentConfigs,
} from './componentRegistry';

// 只读渲染器注册
export {
  registerReadonlyRenderer,
  registerReadonlyRenderers,
  getReadonlyRenderer,
  hasReadonlyRenderer,
  getRendererByMode,
  resetReadonlyRenderers,
  getRegisteredRendererTypes,
  defaultRenderers,
  rendererRegistry,
  readonlyRegistry,
  // 渲染器函数
  textRenderer,
  textareaRenderer,
  optionRenderer,
  checkboxRenderer,
  switchRenderer,
  dateRenderer,
  timeRenderer,
  dateTimeRenderer,
  numberRenderer,
  percentageRenderer,
  currencyRenderer,
  jsonRenderer,
  imageRenderer,
  videoRenderer,
  fileRenderer,
  linkRenderer,
  phoneRenderer,
  emailRenderer,
  idCardRenderer,
  yesNoRenderer,
  maleFemaleRenderer,
  enableDisableRenderer,
  openCloseRenderer,
  statusRenderer,
} from './readonlyRegistry';
