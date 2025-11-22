
export enum OrderStatus {
  AWAITING_LINK = 'awaiting_link',
  READY_TO_SCHEDULE = 'ready_to_schedule',
  SCHEDULED = 'scheduled', // "On Press"
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SHIPPED = 'shipped'
}

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  VOID = 'void'
}

// Simulates a row in Google Sheets
export type SheetRow = (string | number | boolean | null)[];

export interface GoogleSheetData {
  name: string;
  headers: string[];
  rows: SheetRow[];
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  contactName: string;
  rowIndex: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rowIndex: number;
}

export interface Order {
  id: string; // Matches 'job_number' or CSV 'id'
  courseId: string;
  status: OrderStatus;
  details: string; // JSON string in CSV
  trackingNumber: string;
  shippingCarrier: string;
  createdAt: string;
  productionLink: string;
  jobNumber: string;
  rowIndex: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  courseId: string;
  amount: number;
  status: InvoiceStatus;
  pdfUrl: string;
  paymentUrl: string;
  dueDate: string;
  createdAt: string;
  rowIndex: number;
}

export interface Mockup {
  id: string;
  courseId: string;
  type: string;
  notes: string;
  status: 'draft' | 'in_review' | 'approved' | 'revision_needed' | 'pending';
  ziflowLink: string;
  createdAt: string;
  rowIndex: number;
}

export interface SampleRequest {
  id: string;
  customerName: string;
  address: string;
  itemsRequested: string;
  status: 'New' | 'Sent';
  requestDate: string;
  rowIndex: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  image?: string; // Base64 string for display
  timestamp: number;
  isToolOutput?: boolean;
}
