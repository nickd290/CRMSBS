
import React from 'react';
import { LayoutDashboard, ShoppingBag, FileSpreadsheet, Image as ImageIcon, Map, DollarSign, Mail, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, toggleCollapse }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Golf Courses', icon: <Map size={20} /> },
    { id: 'orders', label: 'Production', icon: <ShoppingBag size={20} /> },
    { id: 'invoices', label: 'Invoices', icon: <DollarSign size={20} /> },
    { id: 'products', label: 'Products', icon: <FileSpreadsheet size={20} /> },
    { id: 'mockups', label: 'Mockups', icon: <ImageIcon size={20} /> },
    { id: 'emails', label: 'Emails', icon: <Mail size={20} /> },
  ];

  return (
    <div
      className={`bg-slate-900 text-gray-300 flex flex-col h-full shrink-0 transition-all duration-300 border-r border-slate-800 relative z-40
        fixed md:relative inset-y-0 left-0
        ${isCollapsed ? 'w-0 md:w-16 -translate-x-full md:translate-x-0' : 'w-64 translate-x-0'}
      `}
    >
      {/* Header */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shrink-0 border border-green-400/20">
             SB
           </div>
           {!isCollapsed && (
             <h1 className="text-lg font-bold text-white tracking-tight whitespace-nowrap">Starter Box <span className="font-light text-green-400">Studios</span></h1>
           )}
        </div>
      </div>

      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-16 bg-slate-800 border border-slate-700 rounded-full p-1 text-gray-400 hover:text-white shadow-sm hidden lg:flex"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              // Auto-close sidebar on mobile after selection
              if (window.innerWidth < 768) toggleCollapse();
            }}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all min-h-[44px] md:min-h-0 ${
              activeTab === item.id
                ? 'bg-green-700/50 text-green-400 shadow-inner border border-green-800/50'
                : 'hover:bg-slate-800 hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className={`${activeTab === item.id ? 'text-green-400' : 'text-slate-400 group-hover:text-white'}`}>
                {item.icon}
            </div>
            {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-800">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 ring-2 ring-slate-800">
                OD
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">Ops Director</p>
                  <p className="text-xs text-gray-500 truncate">admin@starterboxstudios.com</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
