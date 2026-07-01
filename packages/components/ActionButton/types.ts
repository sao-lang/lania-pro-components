import type { ReactNode, CSSProperties } from 'react';
import type { ProFormSchema, ProFormProps } from '../ProFormN/types';
import type { ProDialogProps } from '../ProDialog/types';

export interface ActionButtonBaseProps {
  text?: ReactNode;
  visible?: boolean;
  style?: CSSProperties;
  className?: string;
  type?: 'primary' | 'secondary' | 'outline' | 'dashed' | 'text';
  status?: 'default' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  size?: 'mini' | 'small' | 'medium' | 'large';
  shape?: 'default' | 'circle' | 'round';
  ghost?: boolean;
  autoInsertSpace?: boolean;
}

export type ActionButtonProps = ActionButtonBaseProps;

export interface FormButtonProps extends ActionButtonBaseProps {
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

export interface ViewButtonProps extends ActionButtonBaseProps {
  title?: string;
  width?: number | string;
  dialogProps?: Omit<ProDialogProps, 'children'>;
  renderContent: () => ReactNode;
  record?: unknown;
}

export interface DeleteButtonProps extends ActionButtonBaseProps {
  confirmTitle?: string;
  confirmContent?: ReactNode | (() => ReactNode);
  okText?: string;
  cancelText?: string;
  okButtonProps?: ActionButtonBaseProps;
  dialogProps?: Omit<ProDialogProps, 'onOk' | 'onCancel'>;
  onDelete: () => Promise<boolean | void> | boolean | void;
}

export interface ExportButtonProps extends ActionButtonBaseProps {
  exportUrl?: string;
  params?: Record<string, unknown>;
  fileName?: string;
  onExport?: () => Promise<void> | void;
  onBeforeExport?: () => boolean | Promise<boolean>;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ImportButtonProps extends ActionButtonBaseProps {
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

export interface JumpButtonProps extends ActionButtonBaseProps {
  to: string;
  target?: '_blank' | '_self';
  onBeforeJump?: () => boolean | Promise<boolean>;
}

export interface BatchButtonProps extends ActionButtonBaseProps {
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
