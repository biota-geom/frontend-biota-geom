import { MOCK_COMPANY_NAVIGATION_ITEMS } from './companyNavigation.mock';

export function getMockCompanyById(companyId?: string) {
  return MOCK_COMPANY_NAVIGATION_ITEMS.find(
    (company) => company.id === companyId
  );
}
