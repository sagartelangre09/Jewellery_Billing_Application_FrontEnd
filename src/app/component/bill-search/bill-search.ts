import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Bill } from '../../billmodel';
import { shopservice } from '../../shopservice';


@Component({
  selector: 'app-bill-search',
  standalone: true,
  imports: [CommonModule, FormsModule,BillSearch],
  templateUrl: './bill-search.html',
  styleUrls: ['./bill-search.css']
})
export class BillSearch implements OnInit {
  searchQuery: string = '';
  bills: Bill[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  private searchSubject = new Subject<string>();

  constructor(private billService: shopservice) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Ensure query actually changed
      switchMap((query: string) => {
        if (!query.trim()) {
          this.loading = false;
          return of([]); // Return empty list if query is blank
        }
        this.loading = true;
        this.errorMessage = '';
        return this.billService.searchBills(query).pipe(
          catchError((err) => {
            this.errorMessage = 'Failed to fetch bills. Please try again.';
            this.loading = false;
            return of([]);
          })
        );
      })
    ).subscribe((data: Bill[]) => {
      this.bills = data;
      this.loading = false;
    });
  }

  // Called on input change in HTML template
  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }
}