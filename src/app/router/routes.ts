export const APP_ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  admin: {
    root: '/admin',
    companies: '/admin/companies',
    indicators: '/admin/indicators',
  },
  company: {
    root: '/companies/:companyId',
    dashboard: '/companies/:companyId/dashboard',
    licenses: '/companies/:companyId/licenses',
    licenseDetails: '/companies/:companyId/licenses/:licenseId',
    conditions: '/companies/:companyId/conditions',
    indicators: '/companies/:companyId/indicators',
    esg: '/companies/:companyId/esg',
    documents: '/companies/:companyId/documents',
  },
  customer: {
    esg: '/customers/:customerId/esg',
  },
} as const;

export const buildCompanyRoutes = {
  dashboard: (companyId: string) => `/companies/${companyId}/dashboard`,
  licenses: (companyId: string) => `/companies/${companyId}/licenses`,
  licenseDetails: (companyId: string, licenseId: string) =>
    `/companies/${companyId}/licenses/${licenseId}`,
  conditions: (companyId: string) => `/companies/${companyId}/conditions`,
  indicators: (companyId: string) => `/companies/${companyId}/indicators`,
  esg: (companyId: string) => `/companies/${companyId}/esg`,
  documents: (companyId: string) => `/companies/${companyId}/documents`,
} as const;
