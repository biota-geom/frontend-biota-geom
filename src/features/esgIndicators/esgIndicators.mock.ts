/** Historical series shape used by the charts grid (mock — not from API). */
export type EsgHistoricalSeries = {
  indicator_id: string;
  chartTitle: string;
  data: number[];
  labels: string[];
  legend: string;
  unit: string;
};

/** Static placeholder series EsgChartsGrid shows before indicators load. */
export const MOCK_ESG_HISTORICAL_DATA: EsgHistoricalSeries[] = [
  {
    indicator_id: 'mock-water',
    unit: 'm³',
    chartTitle: 'Consumo de Água (m³/mês)',
    legend: 'Consumo de Água (m³)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [10200, 11100, 9300, 14200, 13100, 12450],
  },
  {
    indicator_id: 'mock-waste',
    unit: 't',
    chartTitle: 'Resíduos Gerados (t/mês)',
    legend: 'Resíduos Gerados (t)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [710, 760, 640, 920, 860, 847],
  },
  {
    indicator_id: 'mock-employees',
    unit: 'pessoas',
    chartTitle: 'Nº de Funcionários (pessoas/mês)',
    legend: 'Funcionários (pessoas)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [312, 324, 298, 355, 348, 342],
  },
  {
    indicator_id: 'mock-energy',
    unit: 'kWh',
    chartTitle: 'Consumo de Energia Elétrica (kWh/mês)',
    legend: 'Consumo Mensal (kWh)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [52000, 54200, 48900, 62100, 59800, 58700],
  },
];
