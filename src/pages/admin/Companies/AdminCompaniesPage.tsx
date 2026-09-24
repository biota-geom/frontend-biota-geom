import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { buildCompanyRoutes } from '../../../app/router/routes';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  ArrowRightIcon,
  EditIcon,
  TrashIcon,
} from '../../../components/ui/icons';
import {
  EMPTY_COMPANY_FILTERS,
  filterCompanies,
  listSegmentOptions,
} from '../../../features/companies/companyFilters';
import { COMPANY_MESSAGES } from '../../../features/companies/companyMessages';
import { useCompanies } from '../../../features/companies/useCompanies';
import {
  getCompanyCountLabel,
  getConformityColor,
  getConformityTextColor,
  getStatusLabel,
} from './companyCardFormatting';
import { useState } from 'react';
import { CompanyFilters } from './components/CompanyFilters';
import { CreateCompanyModal } from './components/CreateCompanyModal';
import type { CreateCompanySubmission } from '../../../features/companies/createCompany.types';
import { ApiError } from '../../../services/api/apiError';
import {
  createCompany,
  linkCompanyEsgMetrics,
} from '../../../services/api/companiesApi';

export function AdminCompaniesPage() {
  const { companies, status, error, fetchCompanies } = useCompanies();

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_COMPANY_FILTERS);

  const segmentOptions = useMemo(
    () => listSegmentOptions(companies),
    [companies]
  );
  const visibleCompanies = useMemo(
    () => filterCompanies(companies, filters),
    [companies, filters]
  );

  /*
   * US03 asks the header for the client's registered total, so the count reads
   * `companies` and never `visibleCompanies`: it is the size of the portfolio,
   * not of the current result set, and must hold still while the user types in
   * the search or switches a filter. It stays hidden until there is a real
   * number to show, so the header never flashes a misleading "0 empresas"
   * while the listing is still loading or after it failed before any data
   * arrived.
   */
  const hasLoadedTotal = status === 'success' || companies.length > 0;

  async function handleCreateCompany({
    company,
    esgMetricIds,
  }: CreateCompanySubmission) {
    const created = await createCompany(company);

    if (esgMetricIds.length > 0) {
      try {
        await linkCompanyEsgMetrics(created.id, esgMetricIds);
      } catch (linkError) {
        /*
         * The company itself is already persisted, so the listing has to
         * refresh even though the modal stays open: reporting a plain failure
         * would push the user into retrying a registration that could only
         * answer 409 on the CNPJ. The status carries over so the modal treats
         * it like any other backend error, with copy that says what happened.
         */
        await fetchCompanies();
        throw new ApiError(
          linkError instanceof ApiError ? linkError.status : 0,
          COMPANY_MESSAGES.CREATED_WITHOUT_ESG_METRICS
        );
      }
    }

    await fetchCompanies();
    setIsCreateModalOpen(false);
  }

  return (
    <PageScaffold
      actions={[
        { label: 'Nova Empresa', onClick: () => setIsCreateModalOpen(true) },
      ]}
      subtitle="Gerencie os dados, licenças e conformidade das empresas cadastradas."
      title="Empresas cadastradas"
      titleAside={
        hasLoadedTotal ? (
          <span className="rounded-control inline-flex min-h-6 items-center border border-border bg-surface-muted px-[11px] text-sm font-semibold text-text-secondary">
            {getCompanyCountLabel(companies.length)}
          </span>
        ) : null
      }
    >
      <CompanyFilters
        onChange={setFilters}
        segmentOptions={segmentOptions}
        values={filters}
      />

      {status === 'loading' ? (
        <p className="text-sm font-semibold text-text-muted" role="status">
          Carregando empresas...
        </p>
      ) : null}

      {status === 'error' ? (
        <div className="rounded-panel flex flex-wrap items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <p className="m-0">{error}</p>
          <Button
            onClick={() => fetchCompanies()}
            type="button"
            variant="action"
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {status === 'success' && companies.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Nenhuma empresa cadastrada até o momento.
        </p>
      ) : null}

      {status === 'success' &&
      companies.length > 0 &&
      visibleCompanies.length === 0 ? (
        <div className="flex flex-wrap items-center gap-4">
          <p className="m-0 text-sm text-text-secondary">
            Nenhuma empresa encontrada para os filtros aplicados.
          </p>
          <Button
            onClick={() => setFilters(EMPTY_COMPANY_FILTERS)}
            type="button"
            variant="action"
          >
            Limpar filtros
          </Button>
        </div>
      ) : null}

      {status === 'success' && visibleCompanies.length > 0 ? (
        <section
          aria-label="Empresas cadastradas"
          className="grid grid-cols-3 gap-6 max-[1180px]:grid-cols-2 max-[820px]:grid-cols-1"
        >
          {visibleCompanies.map((company) => (
            <Card
              aria-labelledby={`company-${company.id}-title`}
              key={company.id}
              variant="company"
            >
              <CardHeader variant="company">
                <div className="min-w-0">
                  <CardTitle
                    id={`company-${company.id}-title`}
                    variant="company"
                  >
                    {company.name}
                  </CardTitle>
                  <CardDescription variant="company">
                    {company.segment} • {company.location}
                  </CardDescription>
                </div>

                <CardAction variant="company">
                  <span
                    className={[
                      // Stryker disable next-line all: always-present base class, untested on purpose (see README)
                      'rounded-control inline-flex min-h-6 items-center px-[11px] text-xs font-extrabold',
                      company.status === 'active'
                        ? 'bg-[#d8f8ea] text-primary-strong'
                        : 'bg-amber-100 text-amber-600',
                      // Separator between class fragments, untested on purpose (see README).
                    ].join(' ')}
                  >
                    {getStatusLabel(company.status)}
                  </span>
                  <Button
                    aria-label={`Editar ${company.name}`}
                    disabled
                    type="button"
                    variant="iconSoft"
                  >
                    <EditIcon />
                  </Button>
                  <Button
                    aria-label={`Excluir ${company.name}`}
                    disabled
                    type="button"
                    variant="iconDanger"
                  >
                    <TrashIcon />
                  </Button>
                </CardAction>
              </CardHeader>

              {/* Licenças/Atenção/Vencido ainda não são expostos pela API — placeholders até o backend fornecer esses dados. */}
              <CardContent className="[&_dd]:text-text-muted" variant="company">
                <div>
                  <dt>Licenças</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt>Conformidade</dt>
                  <dd>
                    <span
                      aria-hidden="true"
                      className={`inline-flex size-2 shrink-0 rounded-full ${
                        company.conformityPercentage == null
                          ? 'bg-gray-400'
                          : getConformityColor(company.conformityPercentage)
                      }`}
                      data-testid={`conformity-indicator-${company.id}`}
                    />
                    {company.conformityPercentage == null ? (
                      '—'
                    ) : (
                      <span
                        className={getConformityTextColor(
                          company.conformityPercentage
                        )}
                      >
                        {company.conformityPercentage}%
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Atenção</dt>
                  <dd>
                    <span className="size-2 shrink-0 rounded-full bg-current" />
                    —
                  </dd>
                </div>
                <div>
                  <dt>Vencido</dt>
                  <dd>
                    <span className="size-2 shrink-0 rounded-full bg-current" />
                    —
                  </dd>
                </div>
              </CardContent>

              <CardFooter variant="company">
                <span>Última atualização: —</span>
                <Link
                  className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm font-extrabold text-primary-strong no-underline hover:underline hover:underline-offset-[3px]"
                  to={buildCompanyRoutes.dashboard(company.id)}
                >
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </section>
      ) : null}
      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCompany}
      />
    </PageScaffold>
  );
}
