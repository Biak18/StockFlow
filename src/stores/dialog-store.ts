import { create } from "zustand";

type DialogVariant = "confirm" | "alert";

type DialogOptions = {
  title: string;
  message: string;
  /** confirm = Cancel + action; alert = single OK */
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type DialogState = {
  visible: boolean;
  options: DialogOptions | null;
  resolve: ((value: boolean) => void) | null;

  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (
    options: Omit<DialogOptions, "variant" | "cancelLabel" | "destructive">,
  ) => Promise<void>;
  handleConfirm: () => void;
  handleCancel: () => void;
};

export const useDialogStore = create<DialogState>((set, get) => ({
  visible: false,
  options: null,
  resolve: null,

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({
        visible: true,
        options: { variant: "confirm", ...options },
        resolve,
      });
    }),

  alert: (options) =>
    new Promise<void>((resolve) => {
      set({
        visible: true,
        options: {
          variant: "alert",
          confirmLabel: options.confirmLabel ?? "OK",
          ...options,
        },
        resolve: () => resolve(),
      });
    }),

  handleConfirm: () => {
    const { resolve } = get();
    resolve?.(true);
    set({ visible: false, options: null, resolve: null });
  },

  handleCancel: () => {
    const { resolve, options } = get();
    // alert: cancel (backdrop) still closes and resolves
    if (options?.variant === "alert") {
      resolve?.(true);
    } else {
      resolve?.(false);
    }
    set({ visible: false, options: null, resolve: null });
  },
}));

export function confirmDialog(options: DialogOptions) {
  return useDialogStore.getState().confirm(options);
}

export function alertDialog(
  options: Omit<DialogOptions, "variant" | "cancelLabel" | "destructive">,
) {
  return useDialogStore.getState().alert(options);
}
