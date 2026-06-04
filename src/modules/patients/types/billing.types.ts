export type InvoiceStatus = "paid" | "pending" | "overdue";
export type PaymentMethod = "cash" | "transfer" | "card";

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  visitId?: string;
  date: string; // ISO string
  items: InvoiceItem[];
  amount: number; // Total amount
  paidAmount: number;
  status: InvoiceStatus;
}

export interface Payment {
  id: string;
  patientId: string;
  invoiceId?: string;
  date: string; // ISO string
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

export interface BillingSummary {
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
}
