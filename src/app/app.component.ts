import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Item {
  itemName: string;
  hsn?: string;
  purity?: string;
  pieces?: number;
  metal: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight?: number;
  ratePerGram: number;
  makingCharges: number;
  stoneCharges?: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  http = inject(HttpClient);
  api = 'http://localhost:8082/api';

  shop: any = JSON.parse(localStorage.getItem('shop') || 'null');
  username = '';
  password = '';

  // Form Fields
  customerName = '';
  customerAddress = '';
  customerPhone = '';
  customerPan = '';
  urdNumber = '';
  salesmanName = '';
  billedBy = '';

  taxPercent = 3;
  discount = 0;
  urdDeduction = 0;
  cashPaid = 0;
  amountInWords = '';
  paymode= '';

  items: Item[] = [
    {
      itemName: '',
      hsn: '',
      purity: '99.50',
      pieces: 1,
      metal: 'Gold',
      grossWeight: 0,
      stoneWeight: 0,
      netWeight: 0,
      ratePerGram: 0,
      makingCharges: 0,
      stoneCharges: 0
    }
  ];

  lastBill: any = null;
  history: any[] = [];
  message = '';

  login() {
    this.message = '';
    this.http
      .post<any>(this.api + '/auth/login', {
        username: this.username,
        password: this.password
      })
      .subscribe({
        next: (r) => {
          if (!r.shopId) {
            this.message = r.message || 'Login failed';
            return;
          }
          this.shop = r;
          localStorage.setItem('shop', JSON.stringify(r));
          this.loadHistory();
        },
        error: () => (this.message = 'Invalid username or password')
      });
  }

  logout() {
    localStorage.removeItem('shop');
    this.shop = null;
    this.lastBill = null;
  }

  addItem() {
    this.items.push({
      itemName: '',
      hsn: '',
      purity: '99.50',
      pieces: 1,
      metal: 'Gold',
      grossWeight: 0,
      stoneWeight: 0,
      netWeight: 0,
      ratePerGram: 0,
      makingCharges: 0,
      stoneCharges: 0
    });
  }

  removeItem(i: number) {
    if (this.items.length > 1) {
      this.items.splice(i, 1);
    }
  }

  net(x: Item) {
    return (+x.grossWeight || 0) - (+x.stoneWeight || 0);
  }

  amount(x: Item) {
    const netWeight = this.net(x);
    const rateAmount = netWeight * (+x.ratePerGram || 0);
    const makingAmount = netWeight * (+x.makingCharges || 0);

    return rateAmount + makingAmount ;
  }

  subtotal() {
    return this.items.reduce((s, x) => s + this.amount(x), 0);
  }

  grand() {
    const sub = this.subtotal();
    const afterDiscounts = sub - (+this.discount || 0) - (+this.urdDeduction || 0);
    const taxAmount = (afterDiscounts * (+this.taxPercent || 0)) / 100;
    return Math.max(0, afterDiscounts + taxAmount);
  }

  totalSaleWeight() {
    return this.items.reduce((sum, item) => sum + (this.net(item) || 0), 0);
  }

  generate() {
    if (!this.shop) {
      return;
    }

    this.message = '';

    // Validate weights
    for (const item of this.items) {
      if ((+item.grossWeight || 0) < 0) {
        this.message = 'Gross weight cannot be negative.';
        return;
      }

   


      // Sync computed net weight back into item payload
      item.netWeight = this.net(item);
    }

    const payload = {
      customerName: this.customerName,
      customerAddress: this.customerAddress,
      customerPhone: this.customerPhone,
      customerPan: this.customerPan,
      urdNumber: this.urdNumber,
      salesmanName: this.salesmanName,
      billedBy: this.billedBy,
      taxPercent: this.taxPercent,
      discount: this.discount,
      urdDeduction: this.urdDeduction,
      cashPaid: this.cashPaid,
      amountInWords: this.amountInWords,
      totalSaleWeight: this.totalSaleWeight(),
      items: this.items,
      paymode: this.paymode
    };

    this.http
      .post<any>(`${this.api}/shops/${this.shop.shopId}/bills`, payload)
      .subscribe({
        next: (bill) => {
          this.lastBill = bill;
          this.loadHistory();
          this.downloadPdf(bill.id, bill.billNumber);
        },
        error: (error) => {
          console.error('Bill generation error:', error);
          this.message =
            error?.error?.message || 'Could not generate bill.';
        }
      });
  }

  loadHistory() {
    if (this.shop) {
      this.http
        .get<any[]>(`${this.api}/shops/${this.shop.shopId}/bills`)
        .subscribe((r) => (this.history = r));
    }
  }

  print() {
    window.print();
  }

  downloadPdf(billId: number, billNumber: string) {
    this.http
      .get(`${this.api}/shops/${this.shop.shopId}/bills/${billId}/pdf`, {
        responseType: 'blob'
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${billNumber}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('PDF generation error:', error);
          this.message = 'Bill was saved, but PDF generation failed.';
        }
      });
  }
}