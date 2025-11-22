
import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, FileText, CreditCard, AlertTriangle, CheckCircle2, DollarSign, Download, Upload, ListFilter, CheckCircle, Clock } from 'lucide-react';
import { InvoiceStatus, Invoice } from '../types';
import DetailsPanel from './DetailsPanel';

const Invoices: React.FC = () => {
  const { invoices, customers, importToSheet } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCustomerName = (courseId: string) => {
    const customer = customers.find(c => c.id === courseId);
    return customer ? customer.name : `Unknown (${courseId})`;
  };

  const filteredInvoices = invoices.filter(inv => {
    const customerName = getCustomerName(inv.courseId).toLowerCase();
    const matchesSearch = (
      customerName.includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!matchesSearch) return false;

    if (activeTab === 'paid') return inv.status === InvoiceStatus.PAID;
    if (activeTab === 'unpaid') return inv.status === InvoiceStatus.UNPAID;
    
    return true;
  });

  const totalUnpaid = invoices
    .filter(i => i.status === InvoiceStatus.UNPAID)
    .reduce((sum, i) => sum + i.amount, 0);

  const getStatusBadge = (status: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide
        ${status === InvoiceStatus.PAID ? 'bg-green-50 text-green-700 border border-green-100' : 
          status === InvoiceStatus.UNPAID ? 'bg-red-50 text-red-700 border border-red-100' : 
          'bg-gray-50 text-gray-700 border border-gray-200'}`}>
        {status === InvoiceStatus.PAID ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
        {status}
    </span>
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          await importToSheet('Invoices', text);
          alert('Invoices imported successfully!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.courseId);
    const customerName = customer?.name || 'Valued Customer';
    const customerAddress = customer ? 
      `${customer.address}<br/>${customer.city}, ${customer.state} ${customer.zip}` : 
      'Address on file';

    const date = new Date(invoice.createdAt).toLocaleDateString();
    
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) {
      alert('Please allow popups to download the invoice.');
      return;
    }

    // Custom SVG Logo recreating "Starter Box Studios" brand with Green Hexagon SB
    const logoBase64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgODAiPgogIDwhLS0gTG9nbyBJY29uIC0tPgogIDxnIHRyYW5zZm9ybT0ic2NhbGUoMC43NSkgdHJhbnNsYXRlKDAsNSkiPgogICAgPCEtLSBMZWZ0IEhhbGYgKExpZ2h0IEdyZWVuKSAtLT4KICAgIDxwYXRoIGQ9Ik01MCA5MCBMNSA2OCBMNSAyNSBMNTAgNDggWiIgZmlsbD0iIzg0Y2MxNiIgLz4KICAgIDwhLS0gUmlnaHQgSGFsZiAoRGFyayBHcmVlbikgLS0+CiAgICA8cGF0aCBkPSJNNTAgOTAgTDk1IDY4IEw5NSAyNSBMNTAgNDggWiIgZmlsbD0iIzE1ODAzZCIgLz4KICAgIDwhLS0gVG9wIEZhY2VzIC0tPgogICAgPHBhdGggZD0iTTUgMjUgTDUwIDIgTDUwIDQ4IEw1IDI1IFoiIGZpbGw9IiNhM2U2MzUiIG9wYWNpdHk9IjAuMyIgLz4KICAgIDxwYXRoIGQ9Ik05NSAyNSBMNTAgMiBMNTAgNDggTDk1IDI1IFoiIGZpbGw9IiMxNDUzMmQiIG9wYWNpdHk9IjAuMyIgLz4KICAgIDwhLS0gUyAtLT4KICAgIDxwYXRoIGQ9Ik0yOCA0NSBMNDAgMzggTDI4IDMyIEwxOCAzOCBaIiBmaWxsPSJ3aGl0ZSIgLz4KICAgIDxwYXRoIGQ9Ik0yOCA1OCBMNDAgNTIgTDI4IDQ6IEwxOCA1MiBaIiBmaWxsPSJ3aGl0ZSIgLz4KICAgIDwhLS0gQiAtLT4KICAgIDxwYXRoIGQ9Ik02MiA2OCBMNzIgNjIgTDYyIDU2IEw1MiA2MiBaIiBmaWxsPSJ3aGl0ZSIgLz4KICAgIDxwYXRoIGQ9Ik02MiA1NCBMNzIgNDggTDYyIDQyIEw1MiA0OCBaIiBmaWxsPSJ3aGl0ZSIgLz4KICA8L2c+CgogIDwhLS0gVGV4dCAtLT4KICA8dGV4dCB4PSI4NSIgeT0iNDIiIGZvbnQtZmFtaWx5PSJJbnRlciwgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjgwMCIgZm9udC1zaXplPSIzOCIgZmlsbD0iIzExMTgyNyI+U3RhcnRlciBCb3g8L3RleHQ+CiAgPHRleHQgeD0iODYiIHk9IjcwIiBmb250LWZhbWlseT0iSW50ZXIsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI0MDAiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiMxMTE4MjciIGxldHRlci1zcGFjaW5nPSIyIj5TVFVESU9TPC90ZXh0Pgo8L3N2Zz4=`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @media print {
            @page { margin: 0; size: letter; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 30px 40px !important; }
          }

          body { 
            font-family: 'Inter', sans-serif; 
            color: #1f2937; 
            padding: 30px 40px; 
            max-width: 850px; 
            margin: 0 auto; 
            line-height: 1.3;
            font-size: 13px;
            background: white;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
          }

          .logo-img {
            height: 60px; /* Adjusted for SVG aspect ratio */
            width: auto;
            display: block;
            margin-bottom: 15px;
          }

          .address-block {
            font-size: 12px;
            color: #4b5563;
            line-height: 1.5;
          }

          .invoice-info {
            text-align: right;
          }

          .label-invoice {
            font-size: 12px;
            font-weight: 700;
            color: #16a34a; /* Brand Green */
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }

          .invoice-number {
            font-size: 32px;
            font-weight: 800;
            color: #111827;
            line-height: 1;
            margin-bottom: 6px;
          }

          .invoice-dates {
            font-size: 12px;
            color: #4b5563;
            line-height: 1.4;
          }

          .status-badge {
            display: inline-block;
            margin-top: 8px;
            background-color: ${invoice.status === 'paid' ? '#dcfce7' : '#fee2e2'};
            color: ${invoice.status === 'paid' ? '#166534' : '#991b1b'};
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .bill-to-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 30px;
          }

          .bill-to-label {
            font-size: 10px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .customer-name {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 2px;
          }

          .customer-address {
            font-size: 13px;
            color: #374151;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .items-table th {
            text-align: left;
            padding: 8px 0;
            border-bottom: 2px solid #111827;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #111827;
          }

          .items-table td {
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
          }

          .item-title {
            font-weight: 600;
            color: #111827;
            display: block;
            margin-bottom: 2px;
            font-size: 13px;
          }

          .item-desc {
            font-size: 12px;
            color: #6b7280;
          }

          .text-right { text-align: right; }

          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px; /* Push footer down slightly but keep on page */
          }

          .totals-box {
            width: 250px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: #4b5563;
          }

          .grand-total {
            display: flex;
            justify-content: space-between;
            padding-top: 12px;
            margin-top: 12px;
            border-top: 2px solid #111827;
            font-size: 18px;
            font-weight: 800;
            color: #111827;
          }

          .footer {
            position: fixed;
            bottom: 30px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <img src="${logoBase64}" class="logo-img" alt="Starter Box Studios" />
            <div class="address-block">
              1550 N Northwest Highway<br>
              Park Ridge, IL 60068<br>
              support@starterboxstudios.com
            </div>
          </div>
          
          <div class="invoice-info">
            <div class="label-invoice">Invoice</div>
            <div class="invoice-number">#${invoice.id}</div>
            <div class="invoice-dates">
              Issued: ${date}<br>
              Terms: Due on Receipt
            </div>
            <div class="status-badge">${invoice.status}</div>
          </div>
        </div>

        <div class="bill-to-box">
          <div class="bill-to-label">Bill To</div>
          <div class="customer-name">${customerName}</div>
          <div class="customer-address">${customerAddress}</div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th width="65%">Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span class="item-title">Order #${invoice.orderId} - Production & Supplies</span>
                <span class="item-desc">Custom Golf Scorecards, Pencils, Tees, or Accessories.</span>
              </td>
              <td class="text-right">1</td>
              <td class="text-right">$${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal</span>
              <span>$${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="total-row">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div class="grand-total">
              <span>Total</span>
              <span>$${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Thank you for your business.<br>
          www.starterboxstudios.com • (847) 555-0199 • Park Ridge, IL
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const TabButton = ({ id, label, icon, count }: { id: 'all' | 'paid' | 'unpaid', label: string, icon: React.ReactNode, count: number }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === id 
                ? 'border-green-600 text-green-600 bg-green-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {icon}
        {label}
        <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {count}
        </span>
    </button>
  );

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
        
        {/* Header Area with Stats and Tabs */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800">Invoices</h2>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-xs flex items-center gap-2 mr-4">
                    <span className="text-gray-500">Outstanding:</span>
                    <span className="font-bold text-red-600 text-sm">${totalUnpaid.toLocaleString()}</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search..."
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 w-56"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-xs font-medium shadow-sm transition-colors"
                    title="Import Invoices CSV"
                >
                    <Upload size={14} />
                </button>
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex px-4 gap-1 overflow-x-auto">
              <TabButton 
                  id="all" 
                  label="All Invoices" 
                  icon={<ListFilter size={14}/>} 
                  count={invoices.length} 
              />
              <TabButton 
                  id="unpaid" 
                  label="Unpaid" 
                  icon={<Clock size={14}/>} 
                  count={invoices.filter(i => i.status === InvoiceStatus.UNPAID).length} 
              />
              <TabButton 
                  id="paid" 
                  label="Paid" 
                  icon={<CheckCircle size={14}/>} 
                  count={invoices.filter(i => i.status === InvoiceStatus.PAID).length} 
              />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-24">Invoice #</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-28">Date</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Customer</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-right w-28">Amount</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-center w-24">Status</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-right w-20">Links</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 text-sm italic">
                            No invoices found matching your filter.
                        </td>
                    </tr>
                  ) : filteredInvoices.map((invoice, idx) => (
                      <tr 
                        key={invoice.id || idx} 
                        onClick={() => setSelectedInvoice(invoice)}
                        className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      >
                          <td className="px-3 py-2 text-xs font-mono text-gray-600">{invoice.id}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900 truncate max-w-[16rem]">
                              {getCustomerName(invoice.courseId)}
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-medium text-gray-900">
                              ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-center">
                              {getStatusBadge(invoice.status)}
                          </td>
                          <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {invoice.pdfUrl && <FileText size={14} className="text-gray-500" />}
                                  {invoice.paymentUrl && invoice.status === InvoiceStatus.UNPAID && <CreditCard size={14} className="text-blue-500" />}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Sidebar */}
      <DetailsPanel 
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Invoice #${selectedInvoice?.id}`}
        subtitle={getCustomerName(selectedInvoice?.courseId || '')}
        items={selectedInvoice ? [
            { label: 'Status', value: getStatusBadge(selectedInvoice.status) },
            { label: 'Amount Due', value: <span className="text-xl font-bold text-gray-900">${selectedInvoice.amount.toLocaleString()}</span>, fullWidth: true },
            { label: 'Issue Date', value: new Date(selectedInvoice.createdAt).toLocaleDateString() },
            { label: 'Related Order', value: selectedInvoice.orderId || 'N/A' },
            { label: 'Payment Link', value: selectedInvoice.paymentUrl ? <a href={selectedInvoice.paymentUrl} target="_blank" className="text-blue-600 underline truncate block" rel="noreferrer">{selectedInvoice.paymentUrl}</a> : 'N/A', fullWidth: true },
        ] : []}
        actions={selectedInvoice && (
            <>
                {selectedInvoice.paymentUrl && (
                    <a 
                        href={selectedInvoice.paymentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                    >
                        <CreditCard size={16} /> Pay Now
                    </a>
                )}
                <button 
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
                >
                    <Download size={16} /> Download PDF
                </button>
            </>
        )}
      />
    </>
  );
};

export default Invoices;
