
import React, { useState } from 'react';
import { CRMProvider } from './context/CRMContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Products from './components/Products';
import Mockups from './components/Mockups';
import GolfCourses from './components/GolfCourses';
import Orders from './components/Orders';
import Invoices from './components/Invoices';
import { PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <CRMProvider>
      <div className="flex h-screen overflow-hidden bg-gray-100 font-sans text-sm">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300">
           
           {/* Top Header Bar */}
           <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors lg:hidden"
                >
                  <Menu size={20} />
                </button>
                <h1 className="font-semibold text-gray-700 capitalize">
                  {activeTab.replace('-', ' ')}
                </h1>
              </div>

              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                  isChatOpen 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isChatOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                {isChatOpen ? 'Hide Assistant' : 'AI Assistant'}
              </button>
           </header>

           {/* Scrollable Content Area */}
           <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 overflow-auto p-4 relative">
                  <div className="h-full flex flex-col">
                     {activeTab === 'dashboard' && <Dashboard />}
                     {activeTab === 'courses' && <GolfCourses />}
                     {activeTab === 'orders' && <Orders />}
                     {activeTab === 'invoices' && <Invoices />}
                     {activeTab === 'products' && <Products />}
                     {activeTab === 'mockups' && <Mockups />}
                  </div>
              </main>

              {/* Right Chat Panel */}
              <aside 
                className={`bg-white border-l border-gray-200 transition-all duration-300 flex flex-col ${
                  isChatOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'
                }`}
              >
                 <div className="h-full w-96"> {/* Fixed width container to prevent chat reflow during transition */}
                    <ChatInterface />
                 </div>
              </aside>
           </div>
        </div>
      </div>
    </CRMProvider>
  );
};

export default App;
