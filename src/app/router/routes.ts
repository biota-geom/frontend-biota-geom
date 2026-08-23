export const APP_ROUTES = {
  root: '/',
  login: '/login',
  admin: {
    root: '/admin',
    companies: '/admin/companies',
    legislation: '/admin/legislation',
    indicators: '/admin/indicators',
  },
  company: {
    root: '/companies/:companyId',
    dashboard: '/companies/:companyId/dashboard',
    licenses: '/companies/:companyId/licenses',
    licenseDetails: '/companies/:companyId/licenses/:licenseId',
    obligations: '/companies/:companyId/obligations',
    legislation: '/companies/:companyId/legislation',
    indicators: '/companies/:companyId/indicators',
    documents: '/companies/:companyId/documents',
  },
} as const;

export const buildCompanyRoutes = {
  dashboard: (companyId: string) => `/companies/${companyId}/dashboard`,
  licenses: (companyId: string) => `/companies/${companyId}/licenses`,
  licenseDetails: (companyId: string, licenseId: string) =>
    `/companies/${companyId}/licenses/${licenseId}`,
  obligations: (companyId: string) => `/companies/${companyId}/obligations`,
  legislation: (companyId: string) => `/companies/${companyId}/legislation`,
  indicators: (companyId: string) => `/companies/${companyId}/indicators`,
  documents: (companyId: string) => `/companies/${companyId}/documents`,
} as const;
