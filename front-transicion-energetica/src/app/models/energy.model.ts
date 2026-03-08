export interface ProductionBySourceItem {
  source_name: string;
  total_twh: number;
  region: string;
}

export interface RenewableShareByRegionItem {
  year: number;
  renewables_pct: number;
  region: string;
}

export interface TrendItem {
  year: number;
  porcentaje_renovable_total: number;
  pais: string;
  generacion_twh: number;
}

export interface TopProducerItem {
  pais: string;
  value_twh: number;
}

export interface GlobalShareItem {
  source: string;
  total_generation_twh: number;
  percentage_share: number;
}
