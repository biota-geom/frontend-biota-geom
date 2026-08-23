import { useParams } from 'react-router-dom'
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes'
import { type BreadcrumbItem } from '../../components/layout/BreadcrumbBar'

type CompanyBreadcrumbOptions = {
  parent?: {
    label: string
    to?: (companyId: string) => string
  }
}

export function useCompanyBreadcrumbs(
  currentPage: string,
  options: CompanyBreadcrumbOptions = {},
) {
  const { companyId } = useParams<{ companyId: string }>()
  const companyDashboardPath = companyId
    ? buildCompanyRoutes.dashboard(companyId)
    : undefined

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Empresas', to: APP_ROUTES.admin.companies },
    { label: 'Empresa', to: companyDashboardPath },
  ]

  if (options.parent) {
    breadcrumbs.push({
      label: options.parent.label,
      to:
        companyId && options.parent.to
          ? options.parent.to(companyId)
          : undefined,
    })
  }

  breadcrumbs.push({ label: currentPage })

  return breadcrumbs
}
