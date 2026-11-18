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
import { Label } from '@/components/ui/shadcn/label';
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  formatLegislationNumber,
  formatLegislationType,
} from '../../../../features/legislation/legislationFormatting';
import type { LicenseLegislation } from '../../../../features/legislation/types';
import { ApiError } from '../../../../services/api/apiError';
import { updateLicenseLegislation } from '../../../../services/api/legislationsApi';

export const TECHNICAL_ANALYSIS_MAX_LENGTH = 10000;

const SAVE_ERROR =
  'Não foi possível salvar a análise técnica. Tente novamente mais tarde.';

interface TechnicalAnalysisModalProps {
  licenseId: string;
  /** The radar entry to show; `null` keeps the modal closed. */
  item: LicenseLegislation | null;
  /** False on an archived license: the analysis can be read but not changed. */
  canEdit?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the analysis as saved (`null` when it was cleared). */
  onSaved: (item: LicenseLegislation, technicalAnalysis: string | null) => void;
}

/*
 * Shows an entry's technical analysis and lets the operator write or edit it.
 * The empty state and "Escrever análise" replace "Editar" while nothing is
 * recorded. A blank text is saved as `null`, which clears the analysis.
 */
export function TechnicalAnalysisModal({
  canEdit = true,
  item,
  licenseId,
  onOpenChange,
  onSaved,
}: TechnicalAnalysisModalProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!item) return null;
  const selectedItem = item;
  const title = `${formatLegislationType(selectedItem.legislation.type)} ${formatLegislationNumber(selectedItem.legislation)}`;
  const analysis = selectedItem.technicalAnalysis;
  const isEditing = draft !== null;

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return;
    if (!nextOpen) {
      setDraft(null);
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function startEditing() {
    setError(null);
    setDraft(analysis ?? '');
  }

  function cancelEditing() {
    setError(null);
    setDraft(null);
  }

  async function handleSave() {
    if (draft === null) return;

    const next = draft.trim() === '' ? null : draft.trim();
    setError(null);
    setIsSaving(true);

    try {
      const updated = await updateLicenseLegislation(
        licenseId,
        selectedItem.id,
        { technicalAnalysis: next }
      );
      setIsSaving(false);
      setDraft(null);
      onSaved(selectedItem, updated.technicalAnalysis);
    } catch (caughtError) {
      setIsSaving(false);
      setError(
        caughtError instanceof ApiError ? caughtError.message : SAVE_ERROR
      );
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Análise técnica</DialogTitle>
          <DialogDescription>
            Como {title} afeta esta licença.
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="technical-analysis">Texto da análise</Label>
            <Textarea
              disabled={isSaving}
              id="technical-analysis"
              maxLength={TECHNICAL_ANALYSIS_MAX_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              rows={10}
              value={draft}
            />
            <span className="self-end text-[11px] text-text-muted">
              {draft.length}/
              {TECHNICAL_ANALYSIS_MAX_LENGTH.toLocaleString('pt-BR')}
            </span>
          </div>
        ) : analysis ? (
          <p className="m-0 max-h-[50vh] overflow-y-auto text-sm whitespace-pre-wrap text-text-secondary">
            {analysis}
          </p>
        ) : (
          <p className="m-0 text-sm text-text-secondary">
            Nenhuma análise técnica registrada
          </p>
        )}

        {error ? (
          <p className="m-0 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                disabled={isSaving}
                onClick={cancelEditing}
                type="button"
                variant="subtle"
              >
                Cancelar
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => void handleSave()}
                type="button"
                variant="dialogPrimary"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="subtle"
              >
                Fechar
              </Button>
              {canEdit ? (
                <Button
                  onClick={startEditing}
                  type="button"
                  variant="dialogPrimary"
                >
                  {analysis ? 'Editar' : 'Escrever análise'}
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
