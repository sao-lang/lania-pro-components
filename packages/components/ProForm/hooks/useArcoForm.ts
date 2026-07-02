import { Form } from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react/es/Form/interface';
import type { FormStore } from '../core/FormStore';

export type ArcoFormInstance = FormInstance<Record<string, unknown>, unknown, string>;

export function useArcoForm(_formStore: FormStore): ArcoFormInstance {
  const [arcoForm] = Form.useForm?.() || [];
  if (!arcoForm) {
    throw new Error('Arco Form useForm hook is not available');
  }
  return arcoForm as ArcoFormInstance;
}
