import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, X, Plus, Inbox, Reply, ArrowLeft, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface GmailAccount {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  isRead: boolean;
}

interface EmailDetail extends EmailMessage {
  body: string;
  cc?: string;
}

const Emails: React.FC = () => {
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [replying, setReplying] = useState(false);

  // Compose/Reply form state
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Fetch connected accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch messages when active account changes
  useEffect(() => {
    if (activeAccount) {
      fetchMessages(activeAccount);
    }
  }, [activeAccount]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/accounts`);
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0 && !activeAccount) {
        setActiveAccount(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchMessages = async (accountId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gmail/${accountId}/messages?maxResults=25`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageDetail = async (accountId: string, messageId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gmail/${accountId}/messages/${messageId}`);
      const data = await res.json();
      setSelectedMessage(data);
    } catch (error) {
      console.error('Error fetching message detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/gmail`);
      const data = await res.json();
      window.open(data.authUrl, '_blank');
      // Poll for new accounts after authorization
      setTimeout(() => fetchAccounts(), 3000);
    } catch (error) {
      console.error('Error initiating OAuth:', error);
    }
  };

  const handleRefresh = () => {
    if (activeAccount) {
      fetchMessages(activeAccount);
    }
  };

  const handleCompose = () => {
    setComposing(true);
    setReplying(false);
    setSelectedMessage(null);
    setComposeForm({ to: '', subject: '', body: '' });
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplying(true);
      setComposing(true);
      setComposeForm({
        to: selectedMessage.from.match(/<(.+)>/)?.[1] || selectedMessage.from,
        subject: selectedMessage.subject.startsWith('Re:')
          ? selectedMessage.subject
          : `Re: ${selectedMessage.subject}`,
        body: `\n\n--- Original Message ---\nFrom: ${selectedMessage.from}\nDate: ${selectedMessage.date}\n\n${selectedMessage.body}`
      });
    }
  };

  const handleSend = async () => {
    if (!activeAccount) return;

    setLoading(true);
    try {
      const endpoint = replying && selectedMessage
        ? `${API_BASE}/gmail/${activeAccount}/reply/${selectedMessage.threadId}`
        : `${API_BASE}/gmail/${activeAccount}/send`;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm)
      });

      // Close composer and refresh
      setComposing(false);
      setReplying(false);
      setComposeForm({ to: '', subject: '', body: '' });
      handleRefresh();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCompose = () => {
    setComposing(false);
    setReplying(false);
    setComposeForm({ to: '', subject: '', body: '' });
  };

  const activeAccountData = accounts.find(a => a.id === activeAccount);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            <span className="hidden sm:inline">Gmail Integration</span>
            <span className="sm:hidden">Gmail</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {activeAccount && (
              <>
                <button
                  onClick={handleCompose}
                  className="flex items-center gap-2 px-3 py-2 md:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] md:min-h-0"
                >
                  <Plus size={16} />
                  Compose
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2.5 md:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                  title="Refresh"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </>
            )}
            <button
              onClick={handleConnectAccount}
              className="flex items-center gap-2 px-3 py-2 md:py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px] md:min-h-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Connect Account</span>
              <span className="sm:hidden">Connect</span>
            </button>
          </div>
        </div>

        {/* Account Tabs */}
        {accounts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {accounts.map(account => (
              <button
                key={account.id}
                onClick={() => {
                  setActiveAccount(account.id);
                  setSelectedMessage(null);
                  setComposing(false);
                }}
                className={`px-4 py-2.5 md:py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] md:min-h-0 flex items-center ${
                  activeAccount === account.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {account.email}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {accounts.length === 0 ? (
          // No accounts connected
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <Mail className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Gmail Accounts Connected</h3>
              <p className="text-gray-600 mb-6">
                Connect your Gmail accounts to view and manage emails directly from the CRM.
              </p>
              <button
                onClick={handleConnectAccount}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Connect Your First Account
              </button>
            </div>
          </div>
        ) : composing ? (
          // Compose/Reply View
          <div className="flex-1 flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {replying ? 'Reply to Email' : 'New Email'}
              </h3>
              <button
                onClick={handleCancelCompose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={composeForm.to}
                  onChange={e => setComposeForm({ ...composeForm, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={composeForm.body}
                  onChange={e => setComposeForm({ ...composeForm, body: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Type your message..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelCompose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !composeForm.to || !composeForm.subject}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : selectedMessage ? (
          // Email Detail View
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={18} />
                  Back to Inbox
                </button>
                <button
                  onClick={handleReply}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Reply size={16} />
                  Reply
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{selectedMessage.subject}</h3>
              <div className="text-sm text-gray-600">
                <div><strong>From:</strong> {selectedMessage.from}</div>
                <div><strong>To:</strong> {selectedMessage.to}</div>
                {selectedMessage.cc && <div><strong>CC:</strong> {selectedMessage.cc}</div>}
                <div><strong>Date:</strong> {selectedMessage.date}</div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800">{selectedMessage.body}</pre>
              </div>
            </div>
          </div>
        ) : (
          // Email List View
          <div className="flex-1 overflow-auto">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader size={32} className="animate-spin text-blue-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <Inbox className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600">No emails found</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => fetchMessageDetail(activeAccount!, message.id)}
                    className="w-full text-left px-4 py-4 md:py-3 hover:bg-gray-50 transition-colors cursor-pointer min-h-[60px]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 md:mb-1">
                          {!message.isRead && (
                            <div className="w-2.5 h-2.5 md:w-2 md:h-2 bg-blue-600 rounded-full shrink-0" />
                          )}
                          <p className={`font-medium text-gray-900 truncate text-base md:text-sm ${!message.isRead ? 'font-semibold' : ''}`}>
                            {message.from}
                          </p>
                        </div>
                        <p className={`text-base md:text-sm mb-1.5 md:mb-1 truncate ${!message.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {message.subject}
                        </p>
                        <p className="text-sm text-gray-500 truncate line-clamp-2">{message.snippet}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                        {new Date(message.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Emails;
