import type { ProDialogInstance } from './types';

class InstanceRegistry {
  private instances = new Map<string, ProDialogInstance>();

  register(name: string, instance: ProDialogInstance): void {
    this.instances.set(name, instance);
  }

  unregister(name: string): void {
    this.instances.delete(name);
  }

  get(name: string): ProDialogInstance | undefined {
    return this.instances.get(name);
  }

  getAll(): Map<string, ProDialogInstance> {
    return new Map(this.instances);
  }

  clear(): void {
    this.instances.clear();
  }

  has(name: string): boolean {
    return this.instances.has(name);
  }
}

export const instanceRegistry = new InstanceRegistry();

export function getProDialogInstance(name: string): ProDialogInstance | undefined {
  return instanceRegistry.get(name);
}
