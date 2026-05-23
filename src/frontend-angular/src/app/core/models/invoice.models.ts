export interface InvoiceLineRequest {
  itemName: string;
  quantity: number;
  price: number;
}

export interface InvoiceSaveRequest {
  customerId: number;
  invoiceNumber: string;
  invoiceDate: string;
  lines: InvoiceLineRequest[];
}

export interface InvoiceUpdateRequest {
  customerId: number;
  invoiceNumber: string;
  invoiceDate: string;
  lines: InvoiceLineRequest[];
}

export interface InvoiceLineResponse {
  invoiceLineId: number;
  invoiceId: number;
  itemName: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface InvoiceResponse {
  invoiceId: number;
  customerId: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  userId: number;
  recordDate: string;
  lines: InvoiceLineResponse[];
}