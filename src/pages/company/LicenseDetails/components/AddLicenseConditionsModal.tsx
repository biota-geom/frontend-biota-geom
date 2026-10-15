import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  ADD_LICENSE_CONDITIONS_DEFAULT_VALUES,
  addLicenseConditionsSchema,
  toLicenseConditionBatchItem,
  type AddLicenseConditionsForm,
} from '../../../../features/licenses/createLicenseValidation';
import { ApiError } from '../../../../services/api/apiError';
import { createLicenseConditions } from '../../../../services/api/licenseConditionsApi';
import { LicenseConditionsTable } from '../../Licenses/components/LicenseConditionsTable';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível cadastrar as condicionantes. Tente novamente mais tarde.';

type AddLicenseConditionsModalProps = {
  companyId: string;
  licenseId: string;
  onCreated: (count: number) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function AddLicenseConditionsModal({
  companyId,
  licenseId,
  onCreated,
  onOpenChange,
  open,
}: AddLicenseConditionsModalProps) {
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    reset,
    setError,
  } = useForm<AddLicenseConditionsForm>({
    defaultValues: ADD_LICENSE_CONDITIONS_DEFAULT_VALUES,
    mode: 'onChange',
    resolver: zodResolver(addLicenseConditionsSchema),
  });

  function closeAndReset() {
    reset(ADD_LICENSE_CONDITIONS_DEFAULT_VALUES);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (isSubmitting) return;
    closeAndReset();
  }

  const submit = handleSubmit(async (values) => {
    try {
      await createLicenseConditions(
        companyId,
        licenseId,
        values.conditions.map(toLicenseConditionBatchItem)
      );
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE,
      });
      return;
    }

    onCreated(values.conditions.length);
    closeAndReset();
  });

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Adicionar Condicionantes</DialogTitle>
          <DialogDescription>
            Desmembre a licença em condicionantes. Cada linha vira uma
            condicionante vinculada a esta licença.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <LicenseConditionsTable control={control} disabled={isSubmitting} />

          {errors.root ? (
            <p
              aria-live="polite"
              className="col-span-2 m-0 rounded-sm border border-[#fda29b] bg-[#fef3f2] px-3 py-2.5 text-[13px] font-semibold text-[#b42318] max-[560px]:col-span-1"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}

          <DialogFooter className="col-span-2 max-[560px]:col-span-1">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={!isValid || isSubmitting}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Condicionantes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
