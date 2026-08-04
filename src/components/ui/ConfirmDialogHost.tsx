import { useDialogStore } from "@/stores";
import { ConfirmDialog } from "./ConfirmDialog";

export function ConfirmDialogHost() {
  const visible = useDialogStore((s) => s.visible);
  const options = useDialogStore((s) => s.options);
  const handleConfirm = useDialogStore((s) => s.handleConfirm);
  const handleCancel = useDialogStore((s) => s.handleCancel);

  if (!options) return null;

  return (
    <ConfirmDialog
      visible={visible}
      title={options.title}
      message={options.message}
      variant={options.variant ?? "confirm"}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      destructive={options.destructive}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
