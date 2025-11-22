
import React, { useState, useEffect } from 'react';
import { CRMProvider } from './context/CRMContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Products from './components/Products';
import Mockups from './components/Mockups';
import GolfCourses from './components/GolfCourses';
import Orders from './components/Orders';
import Invoices from './components/Invoices';
import Emails from './components/Emails';
import WelcomeScreen from './components/WelcomeScreen';
import MobileRouteChoice from './components/MobileRouteChoice';
import { PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [mobileChoice, setMobileChoice] = useState<'chat' | 'dashboard' | null>(() => {
    // Desktop users bypass mobile choice
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'dashboard';
    }
    // Check if user chose to skip mobile choice
    const skipChoice = sessionStorage.getItem('skipMobileChoice');
    if (skipChoice) {
      return 'dashboard';
    }
    // Check for existing preference
    const preference = sessionStorage.getItem('mobilePreference');
    return preference as 'chat' | 'dashboard' | null;
  });

  useEffect(() => {
    // Check if welcome screen has been shown in this session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
    sessionStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleMobileChoice = (choice: 'chat' | 'dashboard') => {
    setMobileChoice(choice);
    if (choice === 'chat') {
      setIsChatOpen(true);
      setIsSidebarCollapsed(true); // Hide sidebar on mobile for chat-first experience
    } else {
      setIsChatOpen(false);
      setIsSidebarCollapsed(false); // Show sidebar for dashboard
    }
  };

  // Show mobile route choice if on mobile and no choice made
  if (mobileChoice === null && typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <CRMProvider>
        <MobileRouteChoice onChoose={handleMobileChoice} />
      </CRMProvider>
    );
  }

  return (
    <CRMProvider>
      {/* Welcome Screen */}
      {showWelcome && <WelcomeScreen onDismiss={handleWelcomeDismiss} />}

      <div className="flex min-h-screen md:h-screen md:overflow-hidden bg-gray-100 font-sans text-sm">
        {/* Mobile Sidebar Backdrop */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

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
           <header className="h-14 md:h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 md:p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors lg:hidden min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                >
                  <Menu size={20} />
                </button>
                <h1 className="font-semibold text-gray-700 capitalize text-base md:text-sm">
                  {activeTab.replace('-', ' ')}
                </h1>
              </div>

              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-md border text-xs font-medium transition-all min-h-[44px] md:min-h-0 ${
                  isChatOpen
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isChatOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                <span className="hidden sm:inline">{isChatOpen ? 'Hide Assistant' : 'AI Assistant'}</span>
                <span className="sm:hidden">{isChatOpen ? 'Hide' : 'AI'}</span>
              </button>
           </header>

           {/* Scrollable Content Area */}
           <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 overflow-auto p-3 md:p-4 relative">
                  <div className="h-full flex flex-col">
                     {activeTab === 'dashboard' && <Dashboard />}
                     {activeTab === 'courses' && <GolfCourses />}
                     {activeTab === 'orders' && <Orders />}
                     {activeTab === 'invoices' && <Invoices />}
                     {activeTab === 'products' && <Products />}
                     {activeTab === 'mockups' && <Mockups />}
                     {activeTab === 'emails' && <Emails />}
                  </div>
              </main>

              {/* Right Chat Panel - Full-screen on Mobile, Sidebar on Desktop */}
              {isChatOpen && (
                <>
                  {/* Mobile Chat Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsChatOpen(false)}
                  />

                  {/* Chat Panel */}
                  <aside
                    className={`
                      bg-white flex flex-col transition-all duration-300
                      fixed md:relative inset-0 md:inset-auto z-50 md:z-0
                      md:border-l border-gray-200
                      ${isChatOpen ? 'md:w-96 translate-x-0' : 'md:w-0 translate-x-full md:opacity-0 md:overflow-hidden'}
                    `}
                  >
                     <div className="h-full w-full md:w-96">
                        <ChatInterface />
                     </div>
                  </aside>
                </>
              )}
           </div>
        </div>
      </div>
    </CRMProvider>
  );
};

export default App;
