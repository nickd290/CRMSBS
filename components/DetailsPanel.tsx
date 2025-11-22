
import React from 'react';
import { X } from 'lucide-react';

interface DetailItem {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface DetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items?: DetailItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ isOpen, onClose, title, subtitle, items = [], actions, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end isolate">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl transform transition-transform flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between bg-gray-50/80 shrink-0">
          <div className="pr-4">
            <h3 className="text-lg font-bold text-gray-900 leading-6">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {items.length > 0 && (
              <div className="grid grid-cols-1 gap-y-6">
                {items.map((item, idx) => (
                  <div key={idx} className={item.fullWidth ? 'col-span-1' : ''}>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {item.label}
                    </dt>
                    <dd className="text-sm text-gray-900 font-medium whitespace-pre-wrap break-words leading-relaxed">
                      {item.value || <span className="text-gray-400 italic">N/A</span>}
                    </dd>
                  </div>
                ))}
              </div>
            )}
            
            {children && (
              <div className="mt-6">
                {children}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 gap-3 flex flex-col sm:flex-row shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsPanel;
