import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill } from './billmodel';


@Injectable({
  providedIn: 'root'
})
export class shopservice {
    shop: any = JSON.parse(localStorage.getItem('shop') || 'null');
  //private apiUrl = 'http://localhost:8082/api/bills'; // Update with your backend URL
 private apiUrl = 'http://localhost:8082/api';
  constructor(private http: HttpClient) {}

  // Calls GET /api/bills/search?query=...
  searchBills(query: string): Observable<Bill[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Bill[]>(`${this.apiUrl}/shops/${this.shop.shopId}/bills/search`, { params });
    //.post<any>(`${this.api}/shops/${this.shop.shopId}/bills`, payload)
  }
}