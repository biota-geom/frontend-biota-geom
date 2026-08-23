import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder'
import { PageScaffold } from '../../../components/layout/PageScaffold'
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs'

export function CompanyObligationsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Obrigações')

  return (
    <PageScaffold
      actions={[{ label: 'Nova Obrigação' }]}
      breadcrumbs={breadcrumbs}
      subtitle="Acompanhamento de obrigações, condicionantes e prazos regulatórios."
      title="Monitor de obrigações ambientais"
    >
      <RoutePlaceholder description="O monitor de obrigações ambientais será implementado em uma etapa futura. A criação deverá abrir modal nesta rota." />
    </PageScaffold>
  )
}
