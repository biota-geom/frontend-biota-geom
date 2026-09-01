export type CompanyNavigationItem = {
  attentionCount: number;
  city: string;
  compliance: number;
  id: string;
  licenseCount: number;
  name: string;
  segment: string;
  state: string;
  status: 'active' | 'inactive';
  updatedAt: string;
  overdueCount: number;
};

// TODO: Replace this mocked navigation seed with backend-provided companies.
export const MOCK_COMPANY_NAVIGATION_ITEMS: CompanyNavigationItem[] = [
  {
    attentionCount: 0,
    city: 'Porto Alegre',
    compliance: 100,
    id: 'unidade-industrial-rs',
    licenseCount: 6,
    name: 'Unidade Industrial RS',
    segment: 'Siderurgia',
    state: 'RS',
    status: 'active',
    updatedAt: 'Hoje',
    overdueCount: 0,
  },
  {
    attentionCount: 1,
    city: 'Sorocaba',
    compliance: 85,
    id: 'fabrica-sao-paulo',
    licenseCount: 4,
    name: 'Fábrica São Paulo',
    segment: 'Metalúrgica',
    state: 'SP',
    status: 'active',
    updatedAt: 'Hoje',
    overdueCount: 0,
  },
  {
    attentionCount: 2,
    city: 'Parauapebas',
    compliance: 50,
    id: 'mineracao-norte',
    licenseCount: 12,
    name: 'Mineração Norte',
    segment: 'Extração Mineral',
    state: 'PA',
    status: 'active',
    updatedAt: 'Hoje',
    overdueCount: 1,
  },
  {
    attentionCount: 0,
    city: 'Curitiba',
    compliance: 100,
    id: 'logistica-sul',
    licenseCount: 2,
    name: 'Logística Sul',
    segment: 'Transporte e Dist.',
    state: 'PR',
    status: 'active',
    updatedAt: 'Ontem',
    overdueCount: 0,
  },
  {
    attentionCount: 1,
    city: 'Triunfo',
    compliance: 75,
    id: 'porto-alegre-quimicos',
    licenseCount: 8,
    name: 'Porto Alegre Químicos',
    segment: 'Indústria Química',
    state: 'RS',
    status: 'active',
    updatedAt: 'Ontem',
    overdueCount: 1,
  },
  {
    attentionCount: 0,
    city: 'Sorriso',
    compliance: 90,
    id: 'agro-centro-oeste',
    licenseCount: 5,
    name: 'Agro Centro-Oeste',
    segment: 'Agronegócio',
    state: 'MT',
    status: 'inactive',
    updatedAt: 'Ontem',
    overdueCount: 0,
  },
];
