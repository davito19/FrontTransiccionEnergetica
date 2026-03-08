import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';

import {
  GlobalShareItem,
  ProductionBySourceItem,
  RenewableShareByRegionItem,
  TopProducerItem,
  TrendItem
} from '../../models/energy.model';
import { AuthService } from '../../services/auth.service';
import { EnergyService } from '../../services/energy.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly energyService = inject(EnergyService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly productionCount = signal(0);
  readonly renewableRegionsCount = signal(0);
  readonly trendPointsCount = signal(0);
  readonly globalGenerationTotal = signal(0);

  readonly topProducersTable = signal<TopProducerItem[]>([]);

  readonly filtersForm = this.fb.nonNullable.group({
    year: [2021],
    trendCountry: ['Colombia'],
    trendSource: ['Solar'],
    topSource: ['Wind'],
    topYear: [2021],
    topLimit: [10],
    renewableRegionSearch: ['']
  });

  readonly productionChartType = 'bar' as const;
  readonly productionChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly productionChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'TWh'
        }
      }
    }
  };

  readonly renewableChartType = 'bar' as const;
  readonly renewableChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly renewableChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  readonly trendChartType = 'line' as const;
  readonly trendChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  readonly topChartType = 'bar' as const;
  readonly topChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly topChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  readonly globalShareChartType = 'doughnut' as const;
  readonly globalShareChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    const filters = this.filtersForm.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      production: this.energyService.getProductionBySource(filters.year),
      renewable: this.energyService.getRenewableShareByRegion(filters.year),
      trend: this.energyService.getTrend(filters.trendCountry, filters.trendSource),
      top: this.energyService.getTopProducers(filters.topSource, filters.topYear, filters.topLimit),
      globalShare: this.energyService.getGlobalShare(filters.year)
    }).subscribe({
      next: ({ production, renewable, trend, top, globalShare }) => {
        this.setupProductionChart(production);
        this.setupRenewableChart(renewable, filters.renewableRegionSearch ?? '');
        this.setupTrendChart(trend, filters.trendSource);
        this.setupTopProducers(top);
        this.setupGlobalShare(globalShare);
      },
      error: (error) => {
        this.error.set(error?.error?.message || 'No fue posible cargar los datos del dashboard.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadDashboard();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setupProductionChart(data: ProductionBySourceItem[]): void {
    this.productionCount.set(data.length);

    const regions = Array.from(new Set(data.map((item) => item.region)));
    const sources = Array.from(new Set(data.map((item) => item.source_name)));

    const datasets = sources.map((source, index) => {
      return {
        label: source,
        data: regions.map((region) => {
          const found = data.find((item) => item.region === region && item.source_name === source);
          return found?.total_twh ?? 0;
        }),
        backgroundColor: this.colorByIndex(index, 0.8)
      };
    });

    this.productionChartData.set({
      labels: regions,
      datasets
    });
  }

  private setupRenewableChart(data: RenewableShareByRegionItem[], regionSearch: string): void {
    const normalizedRegion = regionSearch.trim().toLowerCase();

    const filtered = normalizedRegion
      ? data.filter((item) => item.region.toLowerCase().includes(normalizedRegion))
      : data;

    const sorted = [...filtered].sort((a, b) => b.renewables_pct - a.renewables_pct).slice(0, 15);

    this.renewableRegionsCount.set(filtered.length);

    this.renewableChartData.set({
      labels: sorted.map((item) => item.region),
      datasets: [
        {
          label: '% renovable',
          data: sorted.map((item) => Number(item.renewables_pct.toFixed(2))),
          backgroundColor: sorted.map((_, i) => this.colorByIndex(i, 0.7))
        }
      ]
    });
  }

  private setupTrendChart(data: TrendItem[], source: string): void {
    const sorted = [...data].sort((a, b) => a.year - b.year);

    this.trendPointsCount.set(sorted.length);

    this.trendChartData.set({
      labels: sorted.map((item) => item.year),
      datasets: [
        {
          label: `Generacion ${source} (TWh)`,
          data: sorted.map((item) => Number(item.generacion_twh.toFixed(2))),
          borderColor: '#0f5132',
          backgroundColor: 'rgba(15, 81, 50, 0.2)',
          tension: 0.2,
          fill: true
        },
        {
          label: '% renovable total',
          data: sorted.map((item) => Number(item.porcentaje_renovable_total.toFixed(2))),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.2)',
          tension: 0.2,
          fill: false
        }
      ]
    });
  }

  private setupTopProducers(data: TopProducerItem[]): void {
    const sorted = [...data].sort((a, b) => b.value_twh - a.value_twh);

    this.topProducersTable.set(sorted);

    this.topChartData.set({
      labels: sorted.map((item) => item.pais),
      datasets: [
        {
          data: sorted.map((item) => Number(item.value_twh.toFixed(2))),
          backgroundColor: sorted.map((_, i) => this.colorByIndex(i, 0.75))
        }
      ]
    });
  }

  private setupGlobalShare(data: GlobalShareItem[]): void {
    this.globalGenerationTotal.set(data.reduce((acc, item) => acc + item.total_generation_twh, 0));

    this.globalShareChartData.set({
      labels: data.map((item) => item.source),
      datasets: [
        {
          data: data.map((item) => Number(item.percentage_share.toFixed(2))),
          backgroundColor: data.map((_, i) => this.colorByIndex(i, 0.8))
        }
      ]
    });
  }

  private colorByIndex(index: number, opacity: number): string {
    const palette = [
      [25, 135, 84],
      [13, 110, 253],
      [255, 193, 7],
      [220, 53, 69],
      [111, 66, 193],
      [32, 201, 151],
      [253, 126, 20],
      [108, 117, 125]
    ];

    const [r, g, b] = palette[index % palette.length];
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
