export interface Shop {
  id?: number;
  name?: string;
  // add other Shop fields if needed
}

export interface BillItem {
  id?: number;
  // add BillItem fields if needed
}

export interface Bill {
  id: number;
  shop?: Shop;
  billNumber: string;
  urdNumber?: string;
  customerName: string;
  customerAddress?: string;
  customerPhone: string;
  customerPan?: string;
  subtotal: number;
  netPayable: number;
  discount: number;
  urdDeduction: number;
  tax: number;
  cashPaid: number;
  amountInWords?: string;
  totalSaleWeight: number;
  totalUrdWeight: number;
  salesmanName?: string;
  billedBy?: string;
  irnNumber?: string;
  createdAt: string;
  items: BillItem[];
}