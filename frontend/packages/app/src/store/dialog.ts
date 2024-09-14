import { defineStore } from "pinia";

export interface PromptOptions {
  type: "prompt";
  title: string;
  message?: string;
  hidden?: boolean;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmOptions {
  type: "confirm";
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const useDialogStore = defineStore("dialog", () => {
  const currentDialog = ref<PromptOptions | ConfirmOptions | null>(null);
  const currentResolver = ref<{
    resolve(value: any): void;
    reject(reason?: any): void;
  } | null>({
    resolve: (() => {}) as (value: any) => void,
    reject: (() => {}) as (reason?: any) => void,
  });

  function prompt(options: Omit<PromptOptions, "type">) {
    currentResolver.value?.reject(new Error("Dialog closed"));
    return new Promise<string>((resolve, reject) => {
      currentResolver.value = { resolve, reject };

      nextTick(() => {
        currentDialog.value = {
          type: "prompt",
          title: options.title,
          message: options.message,
          cancelText: options.cancelText ?? "Cancelar",
          confirmText: options.confirmText ?? "OK",
          defaultValue: options.defaultValue ?? "",
          hidden: options.hidden ?? false,
          placeholder: options.placeholder ?? "Digite...",
        };
      });
    }).finally(() => {
      currentDialog.value = null;
      currentResolver.value = null;
    });
  }

  function confirm(options: Omit<ConfirmOptions, "type">) {
    return new Promise<string>((resolve, reject) => {
      currentResolver.value?.reject(new Error("Dialog closed"));

      currentResolver.value = { resolve, reject };
      currentDialog.value = {
        type: "confirm",
        title: options.title,
        cancelText: options.cancelText ?? "Não",
        confirmText: options.confirmText ?? "Sim",
        message: options.message,
      };
    }).finally(() => {
      currentDialog.value = null;
      currentResolver.value = null;
    });
  }

  return {
    prompt,
    confirm,
    currentDialog,
    currentResolver,
  };
});
