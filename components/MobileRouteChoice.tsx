import React from 'react';
import { MessageSquare, LayoutDashboard } from 'lucide-react';

interface MobileRouteChoiceProps {
  onChoose: (choice: 'chat' | 'dashboard') => void;
}

export default function MobileRouteChoice({ onChoose }: MobileRouteChoiceProps) {
  const handleChoice = (choice: 'chat' | 'dashboard', rememberChoice: boolean = false) => {
    if (rememberChoice) {
      sessionStorage.setItem('skipMobileChoice', 'true');
    }
    sessionStorage.setItem('mobilePreference', choice);
    onChoose(choice);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center p-6 z-50">
      <div className="max-w-md w-full space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="Starterbox"
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Starterbox
          </h1>
          <p className="text-gray-300 text-lg">
            How would you like to start?
          </p>
        </div>

        {/* Chat Option */}
        <button
          onClick={() => handleChoice('chat')}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl shadow-xl active:scale-[0.98] transition-transform duration-150 min-h-[120px]"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white/20 p-3 rounded-full">
              <MessageSquare className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Chat with AI Assistant
              </h2>
              <p className="text-green-50 text-sm">
                Quick tasks, voice commands, and answers
              </p>
            </div>
          </div>
        </button>

        {/* Dashboard Option */}
        <button
          onClick={() => handleChoice('dashboard')}
          className="w-full bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-white/20 active:scale-[0.98] transition-transform duration-150 min-h-[120px]"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white/20 p-3 rounded-full">
              <LayoutDashboard className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                View Full Dashboard
              </h2>
              <p className="text-gray-200 text-sm">
                Access all CRM features and data tables
              </p>
            </div>
          </div>
        </button>

        {/* Skip Option */}
        <button
          onClick={() => handleChoice('dashboard', true)}
          className="text-gray-400 text-sm w-full text-center py-3 hover:text-gray-300 transition-colors min-h-[44px] active:scale-95"
        >
          Skip and don't ask again
        </button>

        {/* Helper Text */}
        <p className="text-gray-500 text-xs text-center mt-4">
          You can change this preference anytime in settings
        </p>
      </div>
    </div>
  );
}
