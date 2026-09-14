export type Sector = { id: string; name: string };

// TODO(#45): replace this mocked navigation seed with backend-provided sectors.
export const MOCK_SECTORS: Sector[] = [
  { id: 'uuid-siderurgia', name: 'Siderurgia' },
  { id: 'uuid-metalurgica', name: 'Metalúrgica' },
  { id: 'uuid-extracao-mineral', name: 'Extração Mineral' },
  { id: 'uuid-quimica', name: 'Indústria Química' },
  { id: 'uuid-agronegocio', name: 'Agronegócio' },
];
