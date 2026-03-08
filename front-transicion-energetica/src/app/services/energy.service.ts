import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  GlobalShareItem,
  ProductionBySourceItem,
  RenewableShareByRegionItem,
  TopProducerItem,
  TrendItem
} from '../models/energy.model';

@Injectable({ providedIn: 'root' })
export class EnergyService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getProductionBySource(year: number): Observable<ProductionBySourceItem[]> {
    const params = new HttpParams().set('year', year);
    return this.http.get<ProductionBySourceItem[]>(`${this.apiBaseUrl}/api/energy/production-by-source`, { params });
  }

  getRenewableShareByRegion(year: number): Observable<RenewableShareByRegionItem[]> {
    const params = new HttpParams().set('year', year);
    return this.http.get<RenewableShareByRegionItem[]>(`${this.apiBaseUrl}/api/energy/renewable-share-by-region`, {
      params
    });
  }

  getTrend(country: string, source: string): Observable<TrendItem[]> {
    const params = new HttpParams().set('country', country).set('source', source);
    return this.http.get<TrendItem[]>(`${this.apiBaseUrl}/api/energy/trend`, { params });
  }

  getTopProducers(source: string, year: number, limit: number): Observable<TopProducerItem[]> {
    const params = new HttpParams().set('source', source).set('year', year).set('limit', limit);
    return this.http.get<TopProducerItem[]>(`${this.apiBaseUrl}/api/energy/top-producers`, { params });
  }

  getGlobalShare(year: number): Observable<GlobalShareItem[]> {
    const params = new HttpParams().set('year', year);
    return this.http.get<GlobalShareItem[]>(`${this.apiBaseUrl}/api/energy/global-share`, { params });
  }
}
