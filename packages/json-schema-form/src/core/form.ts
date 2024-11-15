import { get, set } from "lodash-es";
import { inject, ModelRef, provide } from "vue";

export interface UseForm {
  set(key: string, value: any): void;
  get(key: string): any;
}

const UseForm = Symbol("UseForm");

export function useForm(): UseForm {
  const result = inject<UseForm>(UseForm);

  if (!result) {
    throw new Error("UseForm not provided");
  }

  return result;
}

export function provideForm(value: ModelRef<any>): void {
  provide(UseForm, {
    set(key: string, newValue: any) {
      value.value = set({ ...value.value }, key, newValue);
    },
    get(key: string) {
      return get(value.value, key);
    },
  });
}

export function getObjectPath(name: string, path?: string) {
  return path ? `${path}.${name}` : name;
}

export function getArrayPath(index: number, path?: string) {
  return path ? `${path}[${index}]` : String(index);
}

export function getPath(key: string | number, path?: string): string {
  return typeof key === "string"
    ? getObjectPath(key, path)
    : getArrayPath(key, path);
}