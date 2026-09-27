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
  paymode = '';

  items: Item[] = [
    {
      itemName: '',
      hsn: '',
      purity: '0',
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
  purity: any;

  // Dynamically calculated getters ensuring live values in payload and UI bindings
  get calculatedSubtotal(): number {
    return this.subtotal();
  }

  get taxAmount(): number {
    const afterDiscounts = this.subtotal() - (+this.discount || 0) - (+this.urdDeduction || 0);
    const taxBase = Math.max(0, afterDiscounts);
    return (taxBase * (+this.taxPercent || 0)) / 100;
  }

  get calculatedNetPayable(): number {
    return this.grand();
  }

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
      purity:'',
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
    const makingAmount = rateAmount * ((+x.makingCharges || 0) / 100);
    return rateAmount + makingAmount;
  }

  isOldMetal(metal: string): boolean {
    if (!metal) return false;
    const clean = metal.trim().toLowerCase();
    return clean.startsWith('old') || clean.includes('_old') || clean.includes('old_');
  }

  subtotal() {
    return this.items.reduce((s, x) => {
      const amt = Math.abs(this.amount(x));
      if (this.isOldMetal(x.metal)) {
        return s - amt;
      }
      return s + amt;
    }, 0);
  }

  grand() {
    const afterDiscounts = this.subtotal() - (+this.discount || 0) - (+this.urdDeduction || 0);
    return afterDiscounts + this.taxAmount;
  }

  totalSaleWeight() {
    return this.items.reduce((sum, item) => {
      const netWt = this.net(item) || 0;
      if (this.isOldMetal(item.metal)) {
        return sum;
      }
      return sum + netWt;
    }, 0);
  }

  private preparePayload() {
    if (!this.shop) return null;

    for (const item of this.items) {
      if ((+item.grossWeight || 0) < 0) {
        this.message = 'Gross weight cannot be negative.';
        return null;
      }
      item.netWeight = this.net(item);
    }

    return {
      customerName: this.customerName,
      customerAddress: this.customerAddress,
      customerPhone: this.customerPhone,
      customerPan: this.customerPan,
      urdNumber: this.urdNumber,
      salesmanName: this.salesmanName,
      billedBy: this.billedBy,
      taxPercent: this.taxPercent,
      discount: this.discount,
      tax: this.taxAmount,
      urdDeduction: this.urdDeduction,
      cashPaid: this.cashPaid,
      amountInWords: this.amountInWords,
      totalSaleWeight: this.totalSaleWeight(),
      items: this.items,
      purity:this.purity,
      paymode: this.paymode,
      subtotal: this.calculatedSubtotal,
      netPayable: this.calculatedNetPayable
    };
  }

  generate() {
    this.message = '';
    const payload = this.preparePayload();
    if (!payload) return;

    this.http
      .post<any>(`${this.api}/shops/${this.shop.shopId}/bills`, payload)
      .subscribe({
        next: (bill) => {
          this.lastBill = bill;
          // this.loadHistory();
          // this.downloadPdf(bill.id, bill.billNumber);
        },
        error: (error) => {
          console.error('Bill generation error:', error);
          this.message = error?.error?.message || 'Could not generate bill.';
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
  this.message = '';
  const payload = this.preparePayload();
  if (!payload) return;

  this.http
    .post<any>(`${this.api}/shops/${this.shop.shopId}/bills`, payload)
    .subscribe({
      next: (bill) => {
        this.lastBill = bill;
        // this.loadHistory();

        // 1. Store original title
        const originalTitle = document.title;

        // 2. Set unique document title for Save as PDF (e.g., BILL-1790481108211_John_Doe)
        const billNo = bill.billNumber || 'Bill';
        const customerName = (bill.customerName || 'Customer').trim().replace(/\s+/g, '_');
        document.title = `${billNo}_${customerName}`;

        // 3. Trigger browser print dialog after DOM updates
        setTimeout(() => {
          window.print();
          
          // 4. Restore original tab title after printing
          document.title = originalTitle;
        }, 100);

        // Optional PDF backend download if needed
         this.downloadPdf(bill.id, bill.billNumber);
      },
      error: (error) => {
        console.error('Bill generation error:', error);
        this.message = error?.error?.message || 'Could not generate bill.';
      }
    });
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