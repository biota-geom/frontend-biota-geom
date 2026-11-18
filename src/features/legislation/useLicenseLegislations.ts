import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getLicenseLegislations } from '../../services/api/legislationsApi';
import type { LegislationImpact, LicenseLegislation } from './types';

type LicenseLegislationsStatus = 'idle' | 'loading' | 'success' | 'error';

/** The fields of an entry that impact and "read" change in place. */
export type LicenseLegislationPatch = Partial<
  Pick<LicenseLegislation, 'impact' | 'readAt'>
>;

/*
 * Loads a license's radar, optionally narrowed to one impact level. Shared by
 * every radar feature (listing, impact, technical analysis). After changing an
 * entry, call `patchLegislation` to update it in place (the list keeps its
 * scroll and open items) or `refetch` to reload the whole radar.
 */
export function useLicenseLegislations(
  licenseId: string | undefined,
  impact: LegislationImpact | null = null
) {
  const [legislations, setLegislations] = useState<LicenseLegislation[]>([]);
  const [status, setStatus] = useState<LicenseLegislationsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (!licenseId) return;

    const safeLicenseId = licenseId;
    let isCurrent = true;

    async function loadLegislations() {
      setStatus('loading');
      setError(null);

      try {
        const result = await getLicenseLegislations(
          safeLicenseId,
          impact ? { impact } : {}
        );
        if (!isCurrent) return;

        setLegislations(result);
        setStatus('success');
      } catch (caught) {
        if (!isCurrent) return;

        setLegislations([]);
        setStatus('error');
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível carregar o radar de legislação.'
        );
      }
    }

    void loadLegislations();

    return () => {
      isCurrent = false;
    };
  }, [licenseId, impact, reloadVersion]);

  /*
   * An entry whose impact stops matching the active filter leaves the list,
   * just as a reload would drop it.
   */
  const patchLegislation = useCallback(
    (id: string, patch: LicenseLegislationPatch) => {
      setLegislations((current) =>
        current.flatMap((item) => {
          if (item.id !== id) return [item];

          const updated = { ...item, ...patch };
          return impact && updated.impact !== impact ? [] : [updated];
        })
      );
    },
    [impact]
  );

  return {
    legislations,
    error,
    patchLegislation,
    refetch: () => setReloadVersion((version) => version + 1),
    status,
  };
}
