
import React, { useRef, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Upload, Plus, Search, Table, Tag, Package } from 'lucide-react';
import { Product } from '../types';
import DetailsPanel from './DetailsPanel';

const Products: React.FC = () => {
  const { products, importToSheet } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          await importToSheet('Products', text);
          alert('Rows appended to "Products" Sheet successfully!');
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Product Sheet</h2>
          <div className="flex gap-3">
              <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
              />
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium shadow-sm transition-colors"
              >
                  <Upload size={16} />
                  Import CSV to Sheet
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm transition-colors">
                  <Plus size={16} />
                  Add Row
              </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Filter rows by name or SKU..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Table size={14} />
                  <span>Syncing with 'Products' Tab</span>
              </div>
          </div>

          <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold sticky top-0 shadow-sm">
                      <tr>
                          <th className="px-6 py-4">Row</th>
                          <th className="px-6 py-4">SKU</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4 text-right">Price</th>
                          <th className="px-6 py-4 text-right">Stock</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map(p => (
                          <tr 
                            key={p.id} 
                            onClick={() => setSelectedProduct(p)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                              <td className="px-6 py-4 font-mono text-xs text-gray-400">{p.rowIndex + 1}</td>
                              <td className="px-6 py-4 font-medium text-gray-900">{p.sku}</td>
                              <td className="px-6 py-4">{p.name}</td>
                              <td className="px-6 py-4">
                                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">{p.category}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-medium">${p.price.toFixed(2)}</td>
                              <td className="px-6 py-4 text-right">{p.stock}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </div>
      </div>

      {/* Details Sidebar */}
      <DetailsPanel 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || ''}
        subtitle={selectedProduct?.sku}
        items={selectedProduct ? [
            { label: 'Category', value: <span className="inline-flex items-center gap-2"><Tag size={14}/> {selectedProduct.category}</span> },
            { label: 'Price', value: `$${selectedProduct.price.toFixed(2)}` },
            { label: 'Current Stock', value: <span className="inline-flex items-center gap-2"><Package size={14}/> {selectedProduct.stock} units</span> },
            { label: 'Row Index', value: selectedProduct.rowIndex + 1 },
        ] : []}
      />
    </>
  );
};

export default Products;
