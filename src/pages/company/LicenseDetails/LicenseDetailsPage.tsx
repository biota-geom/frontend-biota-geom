import { RoutePlaceholder } from '../../../components/feedback/RoutePlaceholder'
import { PageScaffold } from '../../../components/layout/PageScaffold'
import { buildCompanyRoutes } from '../../../app/router/routes'
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs'

export function LicenseDetailsPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Detalhes da licença', {
    parent: { label: 'Licenças', to: buildCompanyRoutes.licenses },
  })

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Estrutura reservada para dados da licença, condicionantes e ações de edição."
      title="Detalhes da licença"
    >
      <RoutePlaceholder description="O detalhamento de licença e condicionantes será implementado em uma etapa futura." />
    </PageScaffold>
  )
}
