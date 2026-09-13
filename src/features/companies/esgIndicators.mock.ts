export type EsgIndicator = { id: string; name: string; unit: string };

// TODO(#45): replace with GET /api/esg-metrics (or /gri-standards).
export const MOCK_ESG_INDICATORS: EsgIndicator[] = [
  { id: 'uuid-agua', name: 'Consumo de Água', unit: 'm³' },
  { id: 'uuid-residuos', name: 'Geração de Resíduos', unit: 't' },
  { id: 'uuid-co2', name: 'Emissão de CO₂', unit: 't CO₂e' },
];
