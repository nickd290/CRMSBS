
import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, Truck, Calendar, Link as LinkIcon, Printer, CheckCircle2, Package, ClipboardList, AlertCircle } from 'lucide-react';
import { OrderStatus, Order } from '../types';
import DetailsPanel from './DetailsPanel';

type OrderStage = 'awaiting_link' | 'ready_to_schedule' | 'scheduled' | 'completed';

const Orders: React.FC = () => {
  const { orders, customers, updateOrderPartial } = useCRM();
  const [activeStage, setActiveStage] = useState<OrderStage>('awaiting_link');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  
  // Inline Input States
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const getCustomerName = (courseId: string) => {
    const customer = customers.find(c => c.id === courseId);
    return customer ? customer.name : `Unknown (${courseId})`;
  };

  // Filter orders based on stage and search
  const filteredOrders = orders.filter(o => {
    const customerName = getCustomerName(o.courseId).toLowerCase();
    const matchesSearch = customerName.includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeStage) {
        case 'awaiting_link':
            return o.status === OrderStatus.AWAITING_LINK;
        case 'ready_to_schedule':
            return o.status === OrderStatus.READY_TO_SCHEDULE;
        case 'scheduled':
            return o.status === OrderStatus.SCHEDULED;
        case 'completed':
            return o.status === OrderStatus.COMPLETED || o.status === OrderStatus.SHIPPED;
        default:
            return true;
    }
  });

  const handleInputChange = (id: string, value: string) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
  };

  // ACTION: Add Production Link -> Moves to Ready To Schedule
  const saveProductionLink = async (orderId: string) => {
    const link = inputValues[orderId];
    if (!link) return;
    await updateOrderPartial(orderId, { 
        productionLink: link,
        status: OrderStatus.READY_TO_SCHEDULE 
    });
    setInputValues(prev => { const n = {...prev}; delete n[orderId]; return n; });
  };

  // ACTION: Batch Schedule -> Moves to Scheduled (On Press)
  const scheduleBatch = async () => {
    const jobNumber = prompt("Enter Job Number for selected orders (e.g., 25-19393):");
    if (!jobNumber) return;

    for (const orderId of selectedBatch) {
        await updateOrderPartial(orderId, {
            jobNumber: jobNumber,
            status: OrderStatus.SCHEDULED
        });
    }
    setSelectedBatch([]);
    alert(`Scheduled ${selectedBatch.length} orders under Job #${jobNumber}`);
  };

  // ACTION: Add Tracking -> Moves to Completed
  const completeOrder = async (orderId: string) => {
    const tracking = inputValues[orderId];
    if (!tracking) return;
    await updateOrderPartial(orderId, {
        trackingNumber: tracking,
        status: OrderStatus.COMPLETED,
        shippingCarrier: 'UPS' // Defaulting for now
    });
    setInputValues(prev => { const n = {...prev}; delete n[orderId]; return n; });
  };

  const toggleSelection = (id: string) => {
    setSelectedBatch(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const formatDetails = (detailsJson: string) => {
    try {
        const data = JSON.parse(detailsJson);
        if (data.description) return data.description;
        if (data.items && Array.isArray(data.items)) {
            return data.items.map((i: any) => `${i.quantity}x ${i.description}`).join(', ');
        }
        return detailsJson;
    } catch (e) {
        return detailsJson;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header & Tabs */}
        <div className="bg-gray-50 border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Production Workflow</h2>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search orders..."
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex px-4 gap-1 overflow-x-auto">
                <TabButton 
                    active={activeStage === 'awaiting_link'} 
                    onClick={() => setActiveStage('awaiting_link')} 
                    icon={<LinkIcon size={14}/>} 
                    label="1. Awaiting Link" 
                    count={orders.filter(o => o.status === OrderStatus.AWAITING_LINK).length}
                />
                <TabButton 
                    active={activeStage === 'ready_to_schedule'} 
                    onClick={() => setActiveStage('ready_to_schedule')} 
                    icon={<ClipboardList size={14}/>} 
                    label="2. Ready to Schedule" 
                    count={orders.filter(o => o.status === OrderStatus.READY_TO_SCHEDULE).length}
                />
                <TabButton 
                    active={activeStage === 'scheduled'} 
                    onClick={() => setActiveStage('scheduled')} 
                    icon={<Printer size={14}/>} 
                    label="3. On Press" 
                    count={orders.filter(o => o.status === OrderStatus.SCHEDULED).length}
                />
                <TabButton 
                    active={activeStage === 'completed'} 
                    onClick={() => setActiveStage('completed')} 
                    icon={<CheckCircle2 size={14}/>} 
                    label="4. Completed" 
                    count={orders.filter(o => o.status === OrderStatus.COMPLETED).length}
                />
            </div>
        </div>

        {/* Batch Action Bar (Only for Ready to Schedule) */}
        {activeStage === 'ready_to_schedule' && selectedBatch.length > 0 && (
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between animate-in slide-in-from-top-2">
                <span className="text-indigo-700 text-sm font-medium">{selectedBatch.length} orders selected</span>
                <button 
                    onClick={scheduleBatch}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Printer size={14} /> Assign Job # & Schedule
                </button>
            </div>
        )}

        {/* Main Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                      {activeStage === 'ready_to_schedule' && (
                          <th className="px-3 py-2 border-b w-8">
                              <input type="checkbox" disabled />
                          </th>
                      )}
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b w-24">Order #</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b w-32">Date</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b w-64">Customer</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">Details</th>
                      {activeStage === 'scheduled' && <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b w-32">Job #</th>}
                      {activeStage === 'completed' && <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b w-32">Tracking</th>}
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b w-64 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredOrders.length === 0 ? (
                      <tr>
                          <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                              No orders in this stage.
                          </td>
                      </tr>
                  ) : filteredOrders.map((order) => (
                      <tr key={order.id} className={`hover:bg-blue-50/50 transition-colors ${selectedBatch.includes(order.id) ? 'bg-indigo-50' : ''}`}>
                          
                          {/* Checkbox for Batching */}
                          {activeStage === 'ready_to_schedule' && (
                              <td className="px-3 py-2">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedBatch.includes(order.id)}
                                    onChange={() => toggleSelection(order.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                              </td>
                          )}

                          <td className="px-3 py-2 text-xs font-mono text-gray-600 cursor-pointer" onClick={() => setSelectedOrder(order)}>{order.id}</td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900 truncate">
                              {getCustomerName(order.courseId)}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 truncate max-w-xs" title={formatDetails(order.details)}>
                              {formatDetails(order.details)}
                          </td>

                          {/* Stage Specific Columns */}
                          {activeStage === 'scheduled' && (
                              <td className="px-3 py-2 text-xs font-mono text-indigo-600">{order.jobNumber}</td>
                          )}
                          {activeStage === 'completed' && (
                              <td className="px-3 py-2 text-xs font-mono text-green-600">{order.trackingNumber}</td>
                          )}

                          {/* Action Column */}
                          <td className="px-3 py-2 text-right">
                              {/* STAGE 1: Enter Link */}
                              {activeStage === 'awaiting_link' && (
                                  <div className="flex justify-end gap-2">
                                      <input 
                                        type="text" 
                                        placeholder="Paste Production Link"
                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:border-blue-500 outline-none"
                                        value={inputValues[order.id] || ''}
                                        onChange={(e) => handleInputChange(order.id, e.target.value)}
                                      />
                                      <button 
                                        onClick={() => saveProductionLink(order.id)}
                                        disabled={!inputValues[order.id]}
                                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 disabled:opacity-50"
                                        title="Save Link & Move to Schedule"
                                      >
                                          <CheckCircle2 size={14} />
                                      </button>
                                  </div>
                              )}

                              {/* STAGE 2: Selection Hint */}
                              {activeStage === 'ready_to_schedule' && (
                                  <span className="text-xs text-gray-400 italic">Select to batch schedule</span>
                              )}

                              {/* STAGE 3: Enter Tracking */}
                              {activeStage === 'scheduled' && (
                                  <div className="flex justify-end gap-2">
                                      <input 
                                        type="text" 
                                        placeholder="Enter Tracking #"
                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-40 focus:border-green-500 outline-none"
                                        value={inputValues[order.id] || ''}
                                        onChange={(e) => handleInputChange(order.id, e.target.value)}
                                      />
                                      <button 
                                        onClick={() => completeOrder(order.id)}
                                        disabled={!inputValues[order.id]}
                                        className="bg-green-600 text-white p-1 rounded hover:bg-green-700 disabled:opacity-50"
                                        title="Complete Order"
                                      >
                                          <Truck size={14} />
                                      </button>
                                  </div>
                              )}

                              {/* STAGE 4: View Details */}
                              {activeStage === 'completed' && (
                                  <button 
                                    onClick={() => setSelectedOrder(order)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                      View Details
                                  </button>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>

      {/* Details Sidebar */}
      <DetailsPanel 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id}`}
        subtitle={selectedOrder ? getCustomerName(selectedOrder.courseId) : ''}
        items={selectedOrder ? [
            { label: 'Current Status', value: <span className="uppercase font-bold text-xs">{selectedOrder.status.replace('_', ' ')}</span> },
            { label: 'Job Number', value: selectedOrder.jobNumber || 'Not assigned' },
            { label: 'Production Link', value: selectedOrder.productionLink ? <a href={selectedOrder.productionLink} target="_blank" className="text-blue-600 underline truncate block max-w-[200px]">{selectedOrder.productionLink}</a> : 'Pending' },
            { label: 'Tracking', value: selectedOrder.trackingNumber || 'Pending' },
            { label: 'Details', value: formatDetails(selectedOrder.details), fullWidth: true },
        ] : []}
      />
    </>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }> = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            active 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {icon}
        {label}
        <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {count}
        </span>
    </button>
);

export default Orders;
