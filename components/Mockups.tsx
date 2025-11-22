
import React from 'react';
import { useCRM } from '../context/CRMContext';
import { Palette, Clock, CheckCircle, AlertCircle, FileImage } from 'lucide-react';

const Mockups: React.FC = () => {
  const { mockups, customers } = useCRM();

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'in_review': return 'bg-blue-100 text-blue-800';
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'revision_needed': return 'bg-amber-100 text-amber-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCustomerName = (courseId: string) => {
    const customer = customers.find(c => c.id === courseId);
    return customer ? customer.name : `Course ID: ${courseId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Design Mockups</h2>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            Upload Mockup
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockups.map(mockup => (
            <div key={mockup.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video w-full bg-gray-100 relative flex items-center justify-center">
                    {mockup.ziflowLink ? (
                        <div className="text-center">
                            <FileImage size={48} className="mx-auto text-gray-400 mb-2" />
                            <a href={mockup.ziflowLink} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">View Proof in ZiFlow</a>
                        </div>
                    ) : (
                        <FileImage size={48} className="text-gray-300" />
                    )}
                    <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(mockup.status)}`}>
                            {mockup.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{getCustomerName(mockup.courseId)}</h3>
                        <Palette size={16} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2" title={mockup.notes}>{mockup.notes}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-4">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>Created {new Date(mockup.createdAt).toLocaleDateString()}</span>
                        </div>
                        {mockup.status === 'approved' ? (
                            <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} />
                                <span>Approved</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-amber-600">
                                <AlertCircle size={14} />
                                <span>Pending</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Mockups;
