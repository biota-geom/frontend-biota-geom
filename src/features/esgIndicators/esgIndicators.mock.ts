import type { EsgIndicatorKey, EsgMonthlyIndicators } from './types';

export type EsgHistoricalSeries = {
  chartTitle: string;
  currentValue: number;
  data: number[];
  indicator: EsgIndicatorKey;
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

export const MOCK_ESG_HISTORICAL_DATA: Record<
  EsgIndicatorKey,
  EsgHistoricalSeries
> = {
  water: {
    indicator: 'water',
    title: 'Consumo de Água',
    unit: 'm³/mês',
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
  waste: {
    indicator: 'waste',
    title: 'Resíduos Gerados',
    unit: 'ton/mês',
    chartTitle: 'Resíduos Gerados (ton/mês)',
    legend: 'Resíduos Gerados (ton)',
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
  employees: {
    indicator: 'employees',
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
  energy: {
    indicator: 'energy',
    title: 'Consumo de Energia',
    unit: 'kWh/mês',
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
};

export const MOCK_DEFAULT_MONTHLY_INDICATORS: EsgMonthlyIndicators = {
  water: 12450,
  waste: 847,
  employees: 342,
  energy: 58700,
};
