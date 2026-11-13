import { useCallback, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { updateLicenseLegislation } from '../../services/api/legislationsApi';
import type { LicenseLegislationPatch } from './useLicenseLegislations';
import type { LegislationImpact } from './types';

/*
 * Edits to a radar entry: classifying its impact and marking it as read. Each
 * successful call reports only the field it changed through `onPatched`, so two
 * calls in flight for the same entry can't overwrite each other with a stale
 * copy of the other's field.
 */
export function useLegislationUpdates(
  licenseId: string | undefined,
  onPatched: (id: string, patch: LicenseLegislationPatch) => void
) {
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const changeImpact = useCallback(
    async (id: string, impact: LegislationImpact | null) => {
      if (!licenseId) return;

      setError(null);
      setSavingIds((current) => new Set(current).add(id));

      try {
        const updated = await updateLicenseLegislation(licenseId, id, {
          impact,
        });
        onPatched(id, { impact: updated.impact });
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível alterar o impacto da legislação.'
        );
      } finally {
        setSavingIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [licenseId, onPatched]
  );

  /*
   * A failure stays silent: opening an entry shouldn't raise an error, and the
   * entry simply keeps its "Novo" tag, so the next time it is opened retries.
   */
  const markAsRead = useCallback(
    async (id: string) => {
      if (!licenseId) return;

      try {
        const updated = await updateLicenseLegislation(licenseId, id, {
          read: true,
        });
        onPatched(id, { readAt: updated.readAt });
      } catch {
        // See above.
      }
    },
    [licenseId, onPatched]
  );

  return { changeImpact, clearError, error, markAsRead, savingIds };
}
