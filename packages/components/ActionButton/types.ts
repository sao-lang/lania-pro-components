import type { ReactNode } from 'react';
import type { ProFormSchema, ProFormProps } from '../ProForm/types';
import type { ProDialogProps } from '../ProDialog/types';
import { ButtonProps } from '@arco-design/web-react';

export interface AddButtonRef {
  open: () => void;
}

export interface EditButtonRef {
  open: () => void;
  loading: boolean;
}

export interface DeleteButtonRef {
  openConfirm: () => void;
  loading: boolean;
}

export interface ViewButtonRef {
  open: () => void;
}

export interface BatchButtonRef {
  execute: () => void;
  loading: boolean;
}

export interface ExportButtonRef {
  export: () => void;
  loading: boolean;
}

export interface ImportButtonRef {
  open: () => void;
  loading: boolean;
}

export interface JumpButtonRef {
  jump: () => void;
}

export type ActionButtonProps = ButtonProps & {
  text?: ReactNode;
  visible?: boolean;
};

export interface FormButtonProps extends Omit<ActionButtonProps, 'onSubmit'> {
  title?: string;
  width?: number | string;
  schemas: ProFormSchema[];
  initialValues?: Record<string, unknown>;
  formProps?: Omit<ProFormProps, 'schemas' | 'onFinish'>;
  dialogProps?: Omit<ProDialogProps, 'schemas' | 'formProps' | 'initialValues'>;
  onSubmit: (values: Record<string, unknown>) => Promise<boolean | void> | boolean | void;
  onBeforeOpen?: () => boolean | void | Promise<boolean | void>;
  onAfterClose?: () => void;
}

export type AddButtonProps = FormButtonProps;

export interface EditButtonProps extends FormButtonProps {
  getInitialValues: () => Record<string, unknown> | Promise<Record<string, unknown>>;
}

export interface ViewButtonProps extends ActionButtonProps {
  title?: string;
  width?: number | string;
  dialogProps?: Omit<ProDialogProps, 'children'>;
  renderContent: () => ReactNode;
  record?: unknown;
}

export interface DeleteButtonProps extends ActionButtonProps {
  confirmTitle?: string;
  confirmContent?: ReactNode | (() => ReactNode);
  okText?: string;
  cancelText?: string;
  okButtonProps?: ActionButtonProps;
  dialogProps?: Omit<ProDialogProps, 'onOk' | 'onCancel'>;
  onDelete: () => Promise<boolean | void> | boolean | void;
}

export interface ExportButtonProps extends ActionButtonProps {
  exportUrl?: string;
  params?: Record<string, unknown>;
  fileName?: string;
  onExport?: () => Promise<void> | void;
  onBeforeExport?: () => boolean | Promise<boolean>;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ImportButtonProps extends ActionButtonProps {
  uploadUrl?: string;
  uploadParams?: Record<string, unknown>;
  accept?: string;
  multiple?: boolean;
  title?: string;
  width?: number | string;
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
  renderUpload?: () => ReactNode;
  onSuccess?: (result: unknown) => void;
  onImportError?: (error: Error) => void;
}

export interface JumpButtonProps extends ActionButtonProps {
  to: string;
  target?: '_blank' | '_self';
  onBeforeJump?: () => boolean | Promise<boolean>;
}

export interface BatchButtonProps extends ActionButtonProps {
  selectedRows: unknown[];
  selectedKeys: (string | number)[];
  needSelection?: boolean;
  minSelection?: number;
  maxSelection?: number;
  selectionWarning?: string;
  needConfirm?: boolean;
  confirmTitle?: string;
  confirmContent?: ReactNode | ((rows: unknown[]) => ReactNode);
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
  onAction: (rows: unknown[], keys: (string | number)[]) => Promise<boolean | void> | boolean | void;
}
