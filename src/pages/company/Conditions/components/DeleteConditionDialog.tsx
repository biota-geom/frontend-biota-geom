import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import type { LicenseCondition } from '../../../../features/licenseConditions/types';

type DeleteConditionDialogProps = {
  /** The condition awaiting confirmation; null while none was asked for. */
  condition: LicenseCondition | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DeleteConditionDialog({
  condition,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: DeleteConditionDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {condition ? `Remover ${condition.title}` : 'Remover condicionante'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deseja remover esta condicionante? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? 'Removendo...' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
