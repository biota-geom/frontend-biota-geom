import { useEffect } from 'react';
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
import { Input } from '@/components/ui/shadcn/input';
import { InputGroup } from '@/components/ui/shadcn/input-group';
import { buildCompanyRoutes } from '../../../app/router/routes';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  EditIcon,
  SearchIcon,
  TrashIcon,
} from '../../../components/ui/icons';
import { useCompanies } from '../../../features/companies/useCompanies';
import { getStatusLabel } from './companyCardFormatting';
import { useState } from 'react';
import { CreateCompanyModal } from './components/CreateCompanyModal';
import type { CreateCompanyRequest } from '../../../features/companies/createCompany.types';

export function AdminCompaniesPage() {
  const { companies, status, error, fetchCompanies } = useCompanies();

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  function handleCreateCompany(payload: CreateCompanyRequest) {
    // TODO(#45): replace console logging with real state/query invalidation
    // once POST /api/customers exists and MOCK_COMPANY_NAVIGATION_ITEMS is
    // replaced by fetched data.
    console.log('create company payload', payload);
    setIsCreateModalOpen(false);
  }
  return (
    <PageScaffold
      actions={[
        { label: 'Nova Empresa', onClick: () => setIsCreateModalOpen(true) },
      ]}
      subtitle="Gerencie os dados, licenças e conformidade das empresas cadastradas."
      title="Empresas cadastradas"
    >
      <div className="rounded-panel mb-8 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border border-border bg-surface p-4 max-[820px]:grid-cols-1">
        <InputGroup as="label" variant="search">
          <SearchIcon />
          <span className="sr-only">Buscar empresas</span>
          <Input
            className="disabled:cursor-default disabled:opacity-100"
            disabled
            placeholder="Buscar por nome da filial, estado ou segmento..."
            type="search"
          />
        </InputGroup>

        <Button disabled type="button" variant="filter">
          Segmento: Todos
          <ChevronDownIcon />
        </Button>
        <Button disabled type="button" variant="filter">
          Status: Ativos
          <ChevronDownIcon />
        </Button>
      </div>

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

      {status === 'success' && companies.length > 0 ? (
        <section
          aria-label="Empresas cadastradas"
          className="grid grid-cols-3 gap-6 max-[1180px]:grid-cols-2 max-[820px]:grid-cols-1"
        >
          {companies.map((company) => (
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

              {/* Licenças/Conformidade/Atenção/Vencido ainda não são expostos pela API — placeholders até o backend fornecer esses dados. */}
              <CardContent className="[&_dd]:text-text-muted" variant="company">
                <div>
                  <dt>Licenças</dt>
                  <dd>—</dd>
                </div>
                <div>
                  <dt>Conformidade</dt>
                  <dd>
                    <span className="size-2 shrink-0 rounded-full bg-current" />
                    —
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
