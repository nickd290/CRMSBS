
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, Product, Order, Invoice, Mockup, SampleRequest, OrderStatus, InvoiceStatus, SheetRow } from '../types';
import { sheetsService } from '../services/sheetsService';

interface CRMContextType {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  invoices: Invoice[];
  mockups: Mockup[];
  samples: SampleRequest[];
  isLoading: boolean;
  lastSync: Date | null;
  
  refreshData: () => Promise<void>;
  addOrder: (customerName: string, orderDetails: string, total: number) => Promise<void>;
  updateOrderStatus: (order: Order, newStatus: OrderStatus) => Promise<void>;
  updateOrderPartial: (orderId: string, updates: Partial<Order>) => Promise<void>;
  importToSheet: (sheetName: string, csvContent: string) => Promise<number>;
  addSampleRequest: (customerName: string, address: string, items: string) => Promise<void>;
  resetData: () => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

// Helper to clean currency strings like "$1,200.00" -> 1200.00
const parseCurrency = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Aggressively remove non-numeric chars except dot and minus
    // This handles "$ 1,200.00" correctly by stripping spaces and commas
    const str = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};

// Helper to clean status strings like "Paid " -> "paid"
const normalizeStatus = (val: any): string => {
    return String(val || '').trim().toLowerCase();
};

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const mapRowToCustomer = (row: SheetRow, index: number): Customer => ({
    id: String(row[0] || ''),
    name: String(row[1] || ''),
    address: String(row[2] || ''),
    city: String(row[3] || ''),
    state: String(row[4] || ''),
    zip: String(row[5] || ''),
    phone: String(row[6] || ''),
    email: String(row[7] || ''),
    website: String(row[8] || ''),
    contactName: String(row[9] || ''),
    rowIndex: index
  });

  const mapRowToProduct = (row: SheetRow, index: number): Product => ({
    id: String(row[0] || ''),
    sku: String(row[1] || ''),
    name: String(row[2] || ''),
    category: String(row[3] || ''),
    price: parseCurrency(row[4]),
    stock: Number(row[5] || 0),
    rowIndex: index
  });

  const mapRowToOrder = (row: SheetRow, index: number): Order => {
    const rawStatus = normalizeStatus(row[2]);
    // Map varying CSV status text to Enum
    let status = OrderStatus.AWAITING_LINK;
    if (rawStatus.includes('ready')) status = OrderStatus.READY_TO_SCHEDULE;
    else if (rawStatus.includes('schedule') || rawStatus.includes('press')) status = OrderStatus.SCHEDULED;
    else if (rawStatus.includes('complete') || rawStatus.includes('shipped')) status = OrderStatus.COMPLETED;
    else if (rawStatus.includes('cancel')) status = OrderStatus.CANCELLED;

    return {
        id: String(row[0] || ''),
        courseId: String(row[1] || ''),
        status: status,
        details: String(row[3] || ''),
        trackingNumber: String(row[4] || ''),
        shippingCarrier: String(row[5] || ''),
        createdAt: String(row[6] || ''),
        productionLink: String(row[7] || ''),
        jobNumber: String(row[8] || ''),
        rowIndex: index
    };
  };

  const mapRowToInvoice = (row: SheetRow, index: number): Invoice => {
    const rawStatus = normalizeStatus(row[4]);
    // Robust check for "paid"
    const status = (rawStatus === 'paid' || rawStatus === 'yes' || rawStatus === 'complete') ? InvoiceStatus.PAID : InvoiceStatus.UNPAID;

    return {
        id: String(row[0] || ''),
        orderId: String(row[1] || ''),
        courseId: String(row[2] || ''),
        amount: parseCurrency(row[3]),
        status: status,
        pdfUrl: String(row[5] || ''),
        paymentUrl: String(row[6] || ''),
        createdAt: String(row[7] || ''),
        dueDate: String(row[7] || ''), 
        rowIndex: index
    };
  };

  const mapRowToMockup = (row: SheetRow, index: number): Mockup => ({
    id: String(row[0] || ''),
    courseId: String(row[1] || ''),
    type: String(row[2] || ''),
    notes: String(row[3] || ''),
    status: (normalizeStatus(row[4]) as any) || 'pending',
    ziflowLink: String(row[5] || ''),
    createdAt: String(row[6] || ''),
    rowIndex: index
  });

  const mapRowToSample = (row: SheetRow, index: number): SampleRequest => ({
    id: String(row[0] || ''),
    customerName: String(row[1] || ''),
    address: String(row[2] || ''),
    itemsRequested: String(row[3] || ''),
    status: (normalizeStatus(row[4]) === 'sent' ? 'Sent' : 'New'),
    requestDate: String(row[5] || ''),
    rowIndex: index
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [custRows, prodRows, ordRows, invRows, mockRows, sampRows] = await Promise.all([
        sheetsService.getSheetValues('Customers'),
        sheetsService.getSheetValues('Products'),
        sheetsService.getSheetValues('Orders'),
        sheetsService.getSheetValues('Invoices'),
        sheetsService.getSheetValues('Mockups'),
        sheetsService.getSheetValues('Samples'),
      ]);

      setCustomers(custRows.map(mapRowToCustomer));
      setProducts(prodRows.map(mapRowToProduct));
      setOrders(ordRows.map(mapRowToOrder));
      setInvoices(invRows.map(mapRowToInvoice));
      setMockups(mockRows.map(mapRowToMockup));
      setSamples(sampRows.map(mapRowToSample));
      setLastSync(new Date());
    } catch (error) {
      console.error("Failed to sync with sheets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const importToSheet = async (sheetName: string, csvContent: string) => {
    setIsLoading(true);
    try {
      const count = await sheetsService.bulkImport(sheetName, csvContent);
      // Small delay to allow persistence to settle
      await new Promise(r => setTimeout(r, 500));
      await refreshData();
      return count;
    } catch (error) {
      console.error(`Failed to import to ${sheetName}`, error);
      throw error;
    }
  };

  const addOrder = async (customerName: string, orderDetails: string, total: number): Promise<void> => {
    const customer = customers.find(c => c.name.toLowerCase().includes(customerName.toLowerCase()));
    const courseId = customer ? customer.id : 'Unknown';
    const newId = `${Date.now()}`; // Simple ID generation
    const date = new Date().toISOString().split('T')[0];

    const orderRow = [
      newId, 
      courseId, 
      OrderStatus.AWAITING_LINK, 
      orderDetails, 
      '', 
      '', 
      date,
      '', 
      ''
    ];

    const invoiceRow = [
        `INV-${newId}`,
        newId,
        courseId,
        total,
        InvoiceStatus.UNPAID,
        '',
        '',
        date
    ];

    await sheetsService.appendRow('Orders', orderRow);
    await sheetsService.appendRow('Invoices', invoiceRow);
    await refreshData();
  };

  const updateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
    const updatedRow = [
      order.id,
      order.courseId,
      newStatus,
      order.details,
      order.trackingNumber,
      order.shippingCarrier,
      order.createdAt,
      order.productionLink,
      order.jobNumber
    ];
    await sheetsService.updateRow('Orders', order.rowIndex, updatedRow);
    await refreshData();
  };

  const updateOrderPartial = async (orderId: string, updates: Partial<Order>) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder = { ...order, ...updates };
    
    const updatedRow = [
        updatedOrder.id,
        updatedOrder.courseId,
        updatedOrder.status,
        updatedOrder.details,
        updatedOrder.trackingNumber,
        updatedOrder.shippingCarrier,
        updatedOrder.createdAt,
        updatedOrder.productionLink,
        updatedOrder.jobNumber
    ];
    
    await sheetsService.updateRow('Orders', order.rowIndex, updatedRow);
    await refreshData();
  };

  const addSampleRequest = async (customerName: string, address: string, items: string) => {
      const newId = `SMP-${Date.now()}`;
      const date = new Date().toISOString().split('T')[0];
      const newRow = [newId, customerName, address, items, 'New', date];
      await sheetsService.appendRow('Samples', newRow);
      await refreshData();
  };

  const resetData = async () => {
    if (confirm("Are you sure you want to reset all data to factory defaults? This cannot be undone.")) {
        await sheetsService.clearData();
    }
  }

  return (
    <CRMContext.Provider value={{ 
      customers, products, orders, invoices, mockups, samples, isLoading, lastSync,
      refreshData, addOrder, updateOrderStatus, updateOrderPartial, importToSheet, addSampleRequest, resetData
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within a CRMProvider");
  return context;
};
