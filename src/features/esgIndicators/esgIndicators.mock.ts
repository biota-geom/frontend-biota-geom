import type { MonthlyIndicator } from './types';

/** Historical series shape used by the charts grid (mock — not from API). */
export type EsgHistoricalSeries = {
  indicator_id: string;
  chartTitle: string;
  currentValue: number;
  data: number[];
  labels: string[];
  legend: string;
  title: string;
  trend: {
    direction: 'up' | 'down';
    isPositive: boolean;
    label: string;
    percentage: number;
  };
  unit: string;
};

/**
 * Static historical series used by EsgChartsGrid and EsgSummaryCards.
 * These are keyed by indicator_id from MOCK_MONTHLY_INDICATORS so the
 * components can look up trend / chart data by id.
 */
export const MOCK_ESG_HISTORICAL_DATA: EsgHistoricalSeries[] = [
  {
    indicator_id: 'mock-water',
    title: 'Consumo de Água',
    unit: 'm³',
    chartTitle: 'Consumo de Água (m³/mês)',
    legend: 'Consumo de Água (m³)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [10200, 11100, 9300, 14200, 13100, 12450],
    currentValue: 12450,
    trend: {
      percentage: 3.2,
      direction: 'down',
      isPositive: true,
      label: '3.2% vs mês anterior',
    },
  },
  {
    indicator_id: 'mock-waste',
    title: 'Resíduos Gerados',
    unit: 't',
    chartTitle: 'Resíduos Gerados (t/mês)',
    legend: 'Resíduos Gerados (t)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [710, 760, 640, 920, 860, 847],
    currentValue: 847,
    trend: {
      percentage: 1.8,
      direction: 'up',
      isPositive: false,
      label: '1.8% vs mês anterior',
    },
  },
  {
    indicator_id: 'mock-employees',
    title: 'Nº de Funcionários',
    unit: 'pessoas',
    chartTitle: 'Nº de Funcionários (pessoas/mês)',
    legend: 'Funcionários (pessoas)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [312, 324, 298, 355, 348, 342],
    currentValue: 342,
    trend: {
      percentage: 2.1,
      direction: 'up',
      isPositive: false,
      label: '2.1% vs mês anterior',
    },
  },
  {
    indicator_id: 'mock-energy',
    title: 'Consumo de Energia',
    unit: 'kWh',
    chartTitle: 'Consumo de Energia Elétrica (kWh/mês)',
    legend: 'Consumo Mensal (kWh)',
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    data: [52000, 54200, 48900, 62100, 59800, 58700],
    currentValue: 58700,
    trend: {
      percentage: 1.5,
      direction: 'down',
      isPositive: true,
      label: '1.5% vs mês anterior',
    },
  },
];

/** Default monthly indicators used as placeholder before data loads. */
export const MOCK_DEFAULT_MONTHLY_INDICATORS: MonthlyIndicator[] = [
  {
    indicator_id: 'mock-water',
    name: 'Consumo de Água',
    unit: 'm³',
    category: 'Ambiental',
    value: 12450,
  },
  {
    indicator_id: 'mock-waste',
    name: 'Resíduos Gerados',
    unit: 't',
    category: 'Ambiental',
    value: 847,
  },
  {
    indicator_id: 'mock-employees',
    name: 'Nº de Funcionários',
    unit: 'pessoas',
    category: 'Social',
    value: 342,
  },
  {
    indicator_id: 'mock-energy',
    name: 'Consumo de Energia',
    unit: 'kWh',
    category: 'Ambiental',
    value: 58700,
  },
];
