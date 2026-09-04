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
import { MOCK_COMPANY_NAVIGATION_ITEMS } from '../../../features/companies/companyNavigation.mock';
import { getComplianceTone, getStatusLabel } from './companyCardFormatting';

export function AdminCompaniesPage() {
  return (
    <PageScaffold
      actions={[{ label: 'Nova Empresa' }]}
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

      <section
        aria-label="Empresas cadastradas"
        className="grid grid-cols-3 gap-6 max-[1180px]:grid-cols-2 max-[820px]:grid-cols-1"
      >
        {MOCK_COMPANY_NAVIGATION_ITEMS.map((company) => {
          const complianceTone = getComplianceTone(company.compliance);

          return (
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
                    {company.segment} • {company.city} - {company.state}
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

              <CardContent variant="company">
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
              </CardContent>

              <CardFooter variant="company">
                <span>Última atualização: {company.updatedAt}</span>
                <Link
                  className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm font-extrabold text-primary-strong no-underline hover:underline hover:underline-offset-[3px]"
                  to={buildCompanyRoutes.dashboard(company.id)}
                >
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </section>
    </PageScaffold>
  );
}
