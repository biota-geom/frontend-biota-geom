import { useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { InputGroup } from '@/components/ui/shadcn/input-group';
import { Label } from '@/components/ui/shadcn/label';
import { ApiError } from '../../../../services/api/apiError';
import { createDocumentFolder } from '../../../../services/api/documentsApi';

type NewFolderDialogProps = {
  companyId: string;
  parentId: string | null;
  parentName: string;
  open: boolean;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
};

const CREATE_ERROR = 'Não foi possível criar a pasta.';

export function NewFolderDialog({
  companyId,
  parentId,
  parentName,
  open,
  onCreated,
  onOpenChange,
}: NewFolderDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName('');
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Informe o nome da pasta.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createDocumentFolder(companyId, {
        name: normalizedName,
        parentId,
      });
      onCreated();
      handleOpenChange(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError ? caughtError.message : CREATE_ERROR
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova pasta</DialogTitle>
          <DialogDescription>
            A pasta será criada dentro de {parentName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="folder-name">Nome da pasta</Label>
            <InputGroup aria-invalid={Boolean(error)} variant="field">
              <Input
                autoFocus
                disabled={isSubmitting}
                id="folder-name"
                maxLength={100}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                placeholder="Ex: Licenças 2026"
                value={name}
              />
            </InputGroup>
            {error ? (
              <p
                className="m-0 text-xs font-semibold text-red-600"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="mt-4">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="subtle"
            >
              Cancelar
            </Button>
            <Button
              disabled={isSubmitting}
              type="submit"
              variant="dialogPrimary"
            >
              {isSubmitting ? 'Criando...' : 'Criar pasta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
