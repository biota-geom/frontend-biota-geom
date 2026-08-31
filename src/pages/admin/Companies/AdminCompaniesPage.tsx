import { Link } from 'react-router-dom';
import { buildCompanyRoutes } from '../../../app/router/routes';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  MOCK_COMPANY_NAVIGATION_ITEMS,
  type CompanyNavigationItem,
} from '../../../features/companies/companyNavigation.mock';

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.75 17.25C14.34 17.25 17.25 14.34 17.25 10.75C17.25 7.16 14.34 4.25 10.75 4.25C7.16 4.25 4.25 7.16 4.25 10.75C4.25 14.34 7.16 17.25 10.75 17.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M15.5 15.5L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 19H9L18.25 9.75L14.25 5.75L5 15V19Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.25 6.75L17.25 10.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="17"
      viewBox="0 0 24 24"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 7.75H17.25M10 10.75V16.25M14 10.75V16.25M9.25 7.75L9.75 5.25H14.25L14.75 7.75M8.25 7.75L8.75 19.25H15.25L15.75 7.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function getComplianceTone(compliance: number) {
  if (compliance >= 90) {
    return '!text-primary-strong';
  }

  if (compliance >= 70) {
    return '!text-amber-500';
  }

  return '!text-red-500';
}

function getStatusLabel(status: CompanyNavigationItem['status']) {
  return status === 'active' ? 'Ativo' : 'Inativo';
}

export function AdminCompaniesPage() {
  return (
    <PageScaffold
      actions={[{ label: 'Nova Empresa' }]}
      subtitle="Gerencie os dados, licenças e conformidade das empresas cadastradas."
      title="Empresas cadastradas"
    >
      <div className="rounded-panel mb-8 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border border-border bg-surface p-4 max-[820px]:grid-cols-1">
        <label className="rounded-control flex min-h-[38px] items-center gap-2.5 bg-surface-muted px-2.5 text-text-secondary">
          <SearchIcon />
          <span className="sr-only">Buscar empresas</span>
          <input
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted disabled:cursor-default disabled:opacity-100"
            disabled
            placeholder="Buscar por nome da filial, estado ou segmento..."
            type="search"
          />
        </label>

        <button
          className="rounded-control inline-flex min-h-[38px] items-center justify-center gap-2 border border-border bg-surface px-4 text-text-secondary disabled:cursor-default disabled:opacity-100"
          disabled
          type="button"
        >
          Segmento: Todos
          <ChevronDownIcon />
        </button>
        <button
          className="rounded-control inline-flex min-h-[38px] items-center justify-center gap-2 border border-border bg-surface px-4 text-text-secondary disabled:cursor-default disabled:opacity-100"
          disabled
          type="button"
        >
          Status: Ativos
          <ChevronDownIcon />
        </button>
      </div>

      <section
        aria-label="Empresas cadastradas"
        className="grid grid-cols-3 gap-6 max-[1180px]:grid-cols-2 max-[820px]:grid-cols-1"
      >
        {MOCK_COMPANY_NAVIGATION_ITEMS.map((company) => {
          const complianceTone = getComplianceTone(company.compliance);

          return (
            <article
              aria-labelledby={`company-${company.id}-title`}
              className="rounded-panel flex min-h-[230px] flex-col border border-border-strong bg-surface p-6 shadow-control max-[520px]:p-5"
              key={company.id}
            >
              <header className="flex justify-between gap-4 border-b border-border pb-[18px] max-[520px]:flex-col max-[520px]:items-start">
                <div className="min-w-0">
                  <h2
                    className="m-0 text-xl leading-[1.2] font-bold text-text-primary"
                    id={`company-${company.id}-title`}
                  >
                    {company.name}
                  </h2>
                  <p className="mt-1 mb-0 text-[13px] leading-[1.45] text-text-secondary">
                    {company.segment} • {company.city} - {company.state}
                  </p>
                </div>

                <div className="flex items-start gap-[9px]">
                  <span
                    className={[
                      'rounded-control inline-flex min-h-6 items-center px-[11px] text-xs font-extrabold',
                      company.status === 'active'
                        ? 'bg-[#d8f8ea] text-primary-strong'
                        : 'bg-amber-100 text-amber-600',
                    ].join(' ')}
                  >
                    {getStatusLabel(company.status)}
                  </span>
                  <button
                    aria-label={`Editar ${company.name}`}
                    className="rounded-control grid size-[26px] place-items-center border-0 bg-[#d8f8ea] p-0 text-primary-strong disabled:cursor-default disabled:opacity-100"
                    disabled
                    type="button"
                  >
                    <EditIcon />
                  </button>
                  <button
                    aria-label={`Excluir ${company.name}`}
                    className="rounded-control grid size-[26px] place-items-center border-0 bg-red-100 p-0 text-red-500 disabled:cursor-default disabled:opacity-100"
                    disabled
                    type="button"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </header>

              <dl className="m-0 grid grid-cols-4 gap-3.5 border-b border-border px-0 pt-5 pb-[18px] [&_dd]:m-0 [&_dd]:flex [&_dd]:items-center [&_dd]:gap-[7px] [&_dd]:text-[21px] [&_dd]:leading-none [&_dd]:font-extrabold [&_dd]:text-text-primary [&_div]:min-w-0 [&_dt]:mb-1.5 [&_dt]:text-xs [&_dt]:text-text-muted max-[520px]:grid-cols-2">
                <div>
                  <dt>Licenças</dt>
                  <dd>{company.licenseCount}</dd>
                </div>
                <div>
                  <dt>Conformidade</dt>
                  <dd className={complianceTone}>
                    <span className="size-2 shrink-0 rounded-full bg-current" />
                    {company.compliance}%
                  </dd>
                </div>
                <div>
                  <dt>Atenção</dt>
                  <dd
                    className={
                      company.attentionCount > 0
                        ? '!text-amber-500'
                        : '!text-primary-strong'
                    }
                  >
                    <span className="size-2 shrink-0 rounded-full bg-current" />
                    {company.attentionCount}
                  </dd>
                </div>
                <div>
                  <dt>Vencido</dt>
                  <dd
                    className={
                      company.overdueCount > 0
                        ? '!text-red-500'
                        : '!text-primary-strong'
                    }
                  >
                    <span className="size-2 shrink-0 rounded-full bg-current" />
                    {company.overdueCount}
                  </dd>
                </div>
              </dl>

              <footer className="mt-auto flex items-center justify-between gap-4 pt-5 text-[13px] text-text-secondary max-[520px]:flex-col max-[520px]:items-start">
                <span>Última atualização: {company.updatedAt}</span>
                <Link
                  className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm font-extrabold text-primary-strong no-underline hover:underline hover:underline-offset-[3px]"
                  to={buildCompanyRoutes.dashboard(company.id)}
                >
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </footer>
            </article>
          );
        })}
      </section>
    </PageScaffold>
  );
}
