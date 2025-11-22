
import React from 'react';
import { useCRM } from '../context/CRMContext';
import { FileSpreadsheet, RefreshCw, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { InvoiceStatus } from '../types';

const Dashboard: React.FC = () => {
  const { invoices, samples, isLoading, lastSync, refreshData, orders, customers } = useCRM();

  const pendingInvoices = invoices.filter(i => i.status === InvoiceStatus.UNPAID).length;
  const totalRevenue = invoices.reduce((sum, i) => sum + i.amount, 0);
  const pendingSamples = samples.filter(s => s.status === 'New').length;

  // Simple chart data - Last 10 invoices
  const data = invoices.slice(0, 10).reverse().map((inv, i) => ({ name: `Inv ${inv.id}`, amt: inv.amount }));

  const getCustomerName = (courseId: string) => {
    const customer = customers.find(c => c.id === courseId);
    return customer ? customer.name : courseId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sheet Overview</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            {isLoading ? (
                <RefreshCw className="animate-spin text-green-600" size={16} />
            ) : (
                <CheckCircle className="text-green-600" size={16} />
            )}
            <span>
                {isLoading ? 'Syncing with Google Sheets...' : `Last synced: ${lastSync?.toLocaleTimeString()}`}
            </span>
            <button onClick={refreshData} className="ml-2 text-green-600 hover:underline">Sync Now</button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileSpreadsheet size={64} />
            </div>
            <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{pendingInvoices}</h3>
            <div className="mt-4 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Action Required in 'Invoices' Tab</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileSpreadsheet size={64} />
            </div>
            <p className="text-sm font-medium text-gray-500">New Sample Requests</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{pendingSamples}</h3>
            <div className="mt-4 text-xs text-blue-500 flex items-center gap-1">
                 <ArrowUpRight size={12} />
                 <span>Check 'Samples' Tab</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileSpreadsheet size={64} />
            </div>
            <p className="text-sm font-medium text-gray-500">Total Invoiced (YTD)</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">${totalRevenue.toLocaleString()}</h3>
            <div className="mt-4 h-6 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line type="monotone" dataKey="amt" stroke="#10B981" strokeWidth={2} dot={false} />
                        <Tooltip />
                    </LineChart>
                 </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent Sheet Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-base md:text-base">Recent Orders</h3>
            <span className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded hidden sm:inline">Tab: Orders</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 min-w-[600px] md:min-w-0">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3">Order ID</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Customer</th>
                        <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.slice(0, 5).map((order, idx) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{order.createdAt}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{getCustomerName(order.courseId)}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                                    {order.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
