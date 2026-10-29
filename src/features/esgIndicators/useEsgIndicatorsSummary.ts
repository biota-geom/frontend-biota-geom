import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getEsgIndicatorsSummary } from '../../services/api/esgIndicatorsApi';
import type { EsgIndicatorsLoadStatus } from './useEsgIndicators';
import type { EsgIndicatorsSummary } from './types';

const LOAD_ERROR_MESSAGE =
  'Não foi possível carregar o resumo dos indicadores.';

type LoadResult = {
  key: string;
  summary: EsgIndicatorsSummary | null;
  error: string | null;
};

/*
 * Same tagging as useEsgIndicators: the result carries the company/month it
 * was loaded for, so a stale summary is never shown as the current one.
 * Without `month` the backend picks the latest month that has a record.
 */
export function useEsgIndicatorsSummary(
  companyId: string | undefined,
  month?: string
) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const key = `${companyId}|${month ?? 'latest'}|${reloadVersion}`;

  useEffect(() => {
    if (!companyId) return;

    let isCurrent = true;

    async function load(safeCompanyId: string) {
      try {
        const summary = await getEsgIndicatorsSummary(safeCompanyId, month);
        if (isCurrent) setResult({ key, summary, error: null });
      } catch (caught) {
        if (!isCurrent) return;
        setResult({
          key,
          summary: null,
          error:
            caught instanceof ApiError ? caught.message : LOAD_ERROR_MESSAGE,
        });
      }
    }

    void load(companyId);

    return () => {
      isCurrent = false;
    };
  }, [companyId, key, month]);

  const current = companyId && result?.key === key ? result : null;

  let status: EsgIndicatorsLoadStatus = 'idle';
  if (companyId) {
    status = current ? (current.error ? 'error' : 'success') : 'loading';
  }

  return {
    error: current?.error ?? null,
    summary: current?.summary ?? null,
    reload: () => setReloadVersion((version) => version + 1),
    status,
  };
}
