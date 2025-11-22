import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, MapPin, Mail, Phone, User, Plus, History, FileText, Box, Palette, Send, ArrowLeft, DollarSign, Check, Layers, Type, Scissors, Upload } from 'lucide-react';
import { Customer, Product } from '../types';
import DetailsPanel from './DetailsPanel';

type TabView = 'overview' | 'history' | 'proposal' | 'action_sample' | 'action_mockup' | 'action_order';
type OrderType = 'scorecard' | 'accessory';

const GolfCourses: React.FC = () => {
  const { customers, orders, mockups, invoices, products, addSampleRequest, addOrder, importToSheet } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Proposal State
  const [proposalProducts, setProposalProducts] = useState<{productId: string, customPrice: number, quantity: number}[]>([]);
  
  // Form State
  const [sampleAddress, setSampleAddress] = useState('');
  const [sampleItems, setSampleItems] = useState('Scorecard, Pencil, Tees');
  const [mockupNotes, setMockupNotes] = useState('');
  
  // Order Form State
  const [orderType, setOrderType] = useState<OrderType>('scorecard');
  
  // Scorecard Specifics
  const [cardPaper, setCardPaper] = useState('80# Matte Cover');
  const [cardSize, setCardSize] = useState('6x8');
  const [cardQuantity, setCardQuantity] = useState(10000);
  const [cardRoundCorners, setCardRoundCorners] = useState(false);
  
  // Accessory Specifics
  const [accessoryDesc, setAccessoryDesc] = useState('');
  const [accessoryQty, setAccessoryQty] = useState(1);

  const [orderTotal, setOrderTotal] = useState(0);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          await importToSheet('Customers', text);
          alert('Courses imported successfully! Please refresh if they do not appear immediately.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCourseSelect = (customer: Customer) => {
    setSelectedCourse(customer);
    setActiveTab('overview');
    setSampleAddress(`${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}`);
    // Initialize proposal with some defaults
    setProposalProducts(products.slice(0,3).map(p => ({ productId: p.id, customPrice: p.price, quantity: 1000 })));
    
    // Reset Order Form
    setOrderType('scorecard');
    setCardPaper('80# Matte Cover');
    setCardSize('6x8');
    setCardQuantity(10000);
    setCardRoundCorners(false);
    setAccessoryDesc('');
    setAccessoryQty(1);
    setOrderTotal(0);
  };

  const getCourseHistory = () => {
    if (!selectedCourse) return { orders: [], mockups: [], invoices: [] };
    return {
      orders: orders.filter(o => o.courseId === selectedCourse.id),
      mockups: mockups.filter(m => m.courseId === selectedCourse.id),
      invoices: invoices.filter(i => i.courseId === selectedCourse.id)
    };
  };

  const handleSendProposal = () => {
    alert(`Proposal sent to ${selectedCourse?.email || 'client'}!`);
    setActiveTab('overview');
  };

  const handleSubmitSample = async () => {
    if (selectedCourse) {
      await addSampleRequest(selectedCourse.name, sampleAddress, sampleItems);
      alert('Sample packet request logged!');
      setActiveTab('history');
    }
  };

  const handleSubmitMockup = () => {
    alert('Design request sent to the art team!');
    setActiveTab('history');
  };

  const handleSubmitOrder = async () => {
    if (selectedCourse) {
      let detailsObj = {};
      
      if (orderType === 'scorecard') {
          const desc = `Scorecard - ${cardSize}, ${cardPaper}${cardRoundCorners ? ', Round Corners' : ''}`;
          detailsObj = {
              type: 'scorecard',
              description: desc,
              items: [{
                  quantity: cardQuantity,
                  description: desc
              }],
              specs: {
                  size: cardSize,
                  paper: cardPaper,
                  roundCorner: cardRoundCorners
              }
          };
      } else {
          detailsObj = {
              type: 'accessory',
              description: accessoryDesc || 'Accessory Order',
              items: [{
                  quantity: accessoryQty,
                  description: accessoryDesc || 'Accessory'
              }]
          };
      }

      await addOrder(selectedCourse.name, JSON.stringify(detailsObj), orderTotal);
      alert('New order created!');
      setActiveTab('history');
    }
  };

  const history = getCourseHistory();

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
              <h2 className="font-semibold text-gray-800">Courses</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {customers.length} Total
              </span>
          </div>
          <div className="flex gap-3">
              <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                      type="text" 
                      placeholder="Search by name, city, state..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
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
                  title="Import Customers CSV"
              >
                  <Upload size={14} />
                  Import
              </button>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-16">ID</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Course Name</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-48">Location</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-48">Contact Person</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-48">Email</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b w-32">Phone</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredCustomers.map(customer => (
                      <tr 
                        key={customer.id} 
                        onClick={() => handleCourseSelect(customer)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                          <td className="px-3 py-2 text-xs font-mono text-gray-400">{customer.id}</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900">{customer.name}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 truncate">
                              {customer.city}, {customer.state}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 truncate">
                              {customer.contactName || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 truncate" title={customer.email}>
                              {customer.email}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                              {customer.phone}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>

      {/* Details Sidebar */}
      <DetailsPanel 
        isOpen={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse?.name || ''}
        subtitle={`ID: ${selectedCourse?.id} • ${selectedCourse?.city}, ${selectedCourse?.state}`}
        // Base items are always shown at top
        items={activeTab === 'overview' && selectedCourse ? [
            { label: 'Contact Person', value: <span className="flex items-center gap-2"><User size={14}/> {selectedCourse.contactName}</span> },
            { label: 'Address', value: <span className="flex items-center gap-2"><MapPin size={14}/> {selectedCourse.address}, {selectedCourse.city}, {selectedCourse.state} {selectedCourse.zip}</span>, fullWidth: true },
            { label: 'Email', value: <a href={`mailto:${selectedCourse.email}`} className="text-blue-600 hover:underline flex items-center gap-2"><Mail size={14}/> {selectedCourse.email}</a> },
            { label: 'Phone', value: <span className="flex items-center gap-2"><Phone size={14}/> {selectedCourse.phone}</span> },
            { label: 'Website', value: selectedCourse.website ? <a href={selectedCourse.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">{selectedCourse.website}</a> : '' },
        ] : []}
        
        // Custom Children for complex views
        children={selectedCourse && (
          <div className="flex flex-col h-full">
            {/* Navigation Tabs */}
            {['overview', 'history', 'proposal'].includes(activeTab) && (
              <div className="flex border-b border-gray-200 mb-6">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'overview' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'history' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  History
                </button>
                <button 
                  onClick={() => setActiveTab('proposal')}
                  className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'proposal' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Pricing & Proposal
                </button>
              </div>
            )}

            {/* BACK BUTTON for Action Views */}
            {activeTab.startsWith('action_') && (
               <button onClick={() => setActiveTab('overview')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
                  <ArrowLeft size={16}/> Back to Overview
               </button>
            )}

            {/* CONTENT: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <History size={14}/> Recent Orders
                  </h4>
                  {history.orders.length > 0 ? (
                    <div className="space-y-2">
                      {history.orders.map(o => (
                        <div key={o.id} className="bg-gray-50 p-3 rounded-md border border-gray-100 text-sm flex justify-between items-center">
                           <div>
                             <span className="font-medium text-gray-900">Order #{o.id}</span>
                             <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</div>
                           </div>
                           <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600">{o.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 italic">No order history</p>}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Palette size={14}/> Mockups
                  </h4>
                  {history.mockups.length > 0 ? (
                    <div className="space-y-2">
                      {history.mockups.map(m => (
                        <div key={m.id} className="bg-gray-50 p-3 rounded-md border border-gray-100 text-sm">
                           <div className="flex justify-between">
                             <span className="font-medium text-gray-900">{m.type}</span>
                             <span className={`text-xs font-medium ${m.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{m.status}</span>
                           </div>
                           <div className="text-xs text-gray-500 mt-1">{m.notes}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 italic">No mockups found</p>}
                </div>
              </div>
            )}

            {/* CONTENT: PROPOSAL */}
            {activeTab === 'proposal' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                  Configure pricing below. This will generate a PDF proposal to email to <strong>{selectedCourse.email}</strong>.
                </p>
                
                <div className="space-y-3">
                  {proposalProducts.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    if(!product) return null;
                    return (
                      <div key={item.productId} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                        <div className="w-20">
                           <label className="text-[10px] text-gray-500">Qty</label>
                           <input type="number" className="w-full text-xs border rounded px-1 py-0.5" value={item.quantity} onChange={(e) => {
                              const newProds = [...proposalProducts];
                              newProds[idx].quantity = Number(e.target.value);
                              setProposalProducts(newProds);
                           }} />
                        </div>
                        <div className="w-20">
                           <label className="text-[10px] text-gray-500">Price</label>
                           <input type="number" className="w-full text-xs border rounded px-1 py-0.5" value={item.customPrice} onChange={(e) => {
                              const newProds = [...proposalProducts];
                              newProds[idx].customPrice = Number(e.target.value);
                              setProposalProducts(newProds);
                           }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleSendProposal} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Send size={14}/> Generate & Send Proposal
                </button>
              </div>
            )}

            {/* ACTION FORMS */}
            {activeTab === 'overview' && (
                <div className="mt-6 grid grid-cols-3 gap-2">
                    <button onClick={() => setActiveTab('action_order')} className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:border-gray-300">
                        <Box size={20} className="text-blue-600 mb-1"/>
                        <span className="text-xs font-medium text-gray-700">New Order</span>
                    </button>
                    <button onClick={() => setActiveTab('action_sample')} className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:border-gray-300">
                        <Layers size={20} className="text-purple-600 mb-1"/>
                        <span className="text-xs font-medium text-gray-700">Send Sample</span>
                    </button>
                    <button onClick={() => setActiveTab('action_mockup')} className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 hover:border-gray-300">
                        <Palette size={20} className="text-pink-600 mb-1"/>
                        <span className="text-xs font-medium text-gray-700">Request Art</span>
                    </button>
                </div>
            )}

            {activeTab === 'action_sample' && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">New Sample Request</h3>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Shipping Address</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1 h-20"
                            value={sampleAddress}
                            onChange={e => setSampleAddress(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Items to Include</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1"
                            value={sampleItems}
                            onChange={e => setSampleItems(e.target.value)}
                        />
                    </div>
                    <button onClick={handleSubmitSample} className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
                        Submit Request
                    </button>
                </div>
            )}

            {activeTab === 'action_mockup' && (
                <div className="space-y-4">
                     <h3 className="font-semibold text-gray-800">Design Mockup Request</h3>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Type</label>
                        <select className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1">
                            <option>Scorecard</option>
                            <option>Yardage Book</option>
                            <option>Other</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500">Notes / Instructions</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1 h-24"
                            placeholder="Describe changes or new design..."
                            value={mockupNotes}
                            onChange={e => setMockupNotes(e.target.value)}
                        />
                     </div>
                     <button onClick={handleSubmitMockup} className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700">
                        Submit to Art Team
                    </button>
                </div>
            )}
            
            {activeTab === 'action_order' && (
                <div className="space-y-4">
                     <h3 className="font-semibold text-gray-800">Create New Order</h3>
                     <div className="flex gap-2 mb-2">
                        <button 
                            className={`flex-1 py-1 text-xs border rounded ${orderType === 'scorecard' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}
                            onClick={() => setOrderType('scorecard')}
                        >
                            Scorecard
                        </button>
                        <button 
                             className={`flex-1 py-1 text-xs border rounded ${orderType === 'accessory' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}
                             onClick={() => setOrderType('accessory')}
                        >
                            Accessory / Other
                        </button>
                     </div>

                     {orderType === 'scorecard' ? (
                         <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Size</label>
                                <select className="w-full text-sm border rounded p-1" value={cardSize} onChange={e => setCardSize(e.target.value)}>
                                    <option>6x8</option>
                                    <option>6x12</option>
                                    <option>4x6</option>
                                    <option>5x7</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Paper</label>
                                <select className="w-full text-sm border rounded p-1" value={cardPaper} onChange={e => setCardPaper(e.target.value)}>
                                    <option>80# Matte Cover</option>
                                    <option>100# Uncoated Cover</option>
                                    <option>10pt Coated 1 Side</option>
                                    <option>Waterproof Synthetic</option>
                                </select>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-gray-500">Quantity</label>
                                <select className="w-full text-sm border rounded p-1" value={cardQuantity} onChange={e => setCardQuantity(Number(e.target.value))}>
                                    <option value={5000}>5,000</option>
                                    <option value={10000}>10,000</option>
                                    <option value={20000}>20,000</option>
                                    <option value={30000}>30,000</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="rc" checked={cardRoundCorners} onChange={e => setCardRoundCorners(e.target.checked)} />
                                <label htmlFor="rc" className="text-sm">Round Corners</label>
                            </div>
                         </div>
                     ) : (
                        <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Item Description</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1"
                                    placeholder="e.g. 10,000 Hex Pencils"
                                    value={accessoryDesc}
                                    onChange={e => setAccessoryDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Quantity</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1"
                                    value={accessoryQty}
                                    onChange={e => setAccessoryQty(Number(e.target.value))}
                                />
                            </div>
                        </div>
                     )}

                     <div>
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><DollarSign size={12}/> Estimated Total</label>
                        <input 
                            type="number" 
                            className="w-full border border-gray-300 rounded-md p-2 text-sm mt-1 font-semibold"
                            value={orderTotal}
                            onChange={e => setOrderTotal(Number(e.target.value))}
                            placeholder="0.00"
                        />
                     </div>

                     <button onClick={handleSubmitOrder} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                        Create Order
                    </button>
                </div>
            )}

          </div>
        )}
      />
    </>
  );
};

export default GolfCourses;