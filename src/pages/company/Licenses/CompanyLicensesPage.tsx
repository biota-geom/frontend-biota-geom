import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder'
import { PageScaffold } from '../../../components/layout/PageScaffold'
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs'

export function CompanyLicensesPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Licenças')

  return (
    <PageScaffold
      actions={[{ label: 'Nova Licença' }]}
      breadcrumbs={breadcrumbs}
      subtitle="Controle e monitoramento das licenças ambientais da empresa."
      title="Painel de licenças ambientais"
    >
      <RoutePlaceholder description="A listagem de licenças ambientais será implementada em uma etapa futura. A criação deverá abrir modal nesta rota." />
    </PageScaffold>
  )
}
