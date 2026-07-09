// 导出类型
export type {
  ProDialogProps,
  ProDialogInstance,
  DialogMode,
  DialogSize,
  DrawerPlacement,
  FooterPosition,
  DialogButtonConfig,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  FormDialogProps,
  TableDialogProps,
  DialogState,
  DialogEventType,
  DialogEventListener,
  PopconfirmConfig,
  MessageConfig,
  NotificationConfig,
  MessageReturn,
  NotificationReturn,
  ProMessageStatic,
  ProNotificationStatic,
  ProNotifyStatic,
} from './types';
export * from './ProDialog';

// 导出 Hook 和工具
export { useProDialog } from './useProDialog';
export { getProDialogInstance, instanceRegistry as dialogInstanceRegistry } from './instanceRegistry';
export type { ProFormSchema } from '../ProForm/types';
export type { ProColumnType } from '../ProTable/types';
