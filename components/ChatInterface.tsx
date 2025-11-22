
import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { ai, createToolDeclarations, getGeminiModel } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, User, Bot, Sparkles, Database, Mic, MicOff, XCircle, Volume2, AlertCircle, Activity, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Remove data url prefix for API
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = reject;
  });
};

const ChatInterface: React.FC = () => {
  const { addOrder, orders, customers, samples, invoices, products, addSampleRequest, refreshData } = useCRM();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'model', text: 'Welcome to Starter Box Database. I can help you look up courses, track jobs, check inventory, or manage invoices.', timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Attachment State
  const [attachment, setAttachment] = useState<{ file: File, preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Live API Refs
  const liveSessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceRefs = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const botSpeakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live Transcription Accumulators
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAttachment({
          file,
          preview: evt.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Tool Execution Helper ---
  const executeTool = async (name: string, args: any) => {
    console.log(`Executing tool: ${name}`, args);
    try {
      if (name === 'log_new_order') {
        const { customerName, itemsDescription, estimatedTotal } = args;
        const orderId = await addOrder(customerName, itemsDescription, estimatedTotal);
        return { success: true, orderId, message: `Successfully created Order #${orderId} for ${customerName}.` };
      
      } else if (name === 'check_sheet_status') {
        const { queryType } = args;
        if (queryType === 'PENDING_INVOICES') {
          const pending = invoices.filter(i => i.status === 'unpaid');
          const totalAmount = pending.reduce((sum, i) => sum + i.amount, 0);
          return { 
              count: pending.length, 
              totalAmount: totalAmount,
              summary: `Found ${pending.length} unpaid invoices totaling $${totalAmount.toLocaleString()}.` 
          };
        } else if (queryType === 'SAMPLE_REQUESTS') {
          const pending = samples.filter(s => s.status === 'New');
          return { 
              count: pending.length, 
              summary: `There are ${pending.length} new sample packet requests waiting to be processed.` 
          };
        } else {
          const recent = orders.slice(0, 3).map(o => `Order #${o.id} (${o.status})`);
          return { recentOrders: recent };
        }
      
      } else if (name === 'find_golf_course') {
        const { name } = args;
        const found = customers.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));
        return { 
            foundCount: found.length, 
            matches: found.map(c => ({
                id: c.id,
                name: c.name,
                location: `${c.city}, ${c.state}`,
                email: c.email
            }))
        };
      
      } else if (name === 'log_sample_request') {
         const { customerName, address, items } = args;
         await addSampleRequest(customerName, address, items);
         return { success: true, message: `Sample request logged for ${customerName}.` };
      
      } else if (name === 'lookup_product') {
         const { searchTerm } = args;
         const found = products.filter(p => 
             p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             p.sku.toLowerCase().includes(searchTerm.toLowerCase())
         );
         return {
             foundCount: found.length,
             products: found.map(p => ({
                 sku: p.sku,
                 name: p.name,
                 price: p.price,
                 stock: p.stock
             }))
         };

      } else if (name === 'get_invoice_details') {
         const { invoiceId } = args;
         const inv = invoices.find(i => i.id === invoiceId || i.id === `INV-${invoiceId}`);
         if (!inv) return { found: false, message: "Invoice not found" };
         
         // Find associated customer name
         const customer = customers.find(c => c.id === inv.courseId);
         return {
             found: true,
             invoice: {
                 id: inv.id,
                 customer: customer ? customer.name : "Unknown",
                 amount: inv.amount,
                 status: inv.status,
                 date: inv.createdAt,
                 paymentUrl: inv.paymentUrl
             }
         };
      }

      return { error: "Unknown function" };
    } catch (e: any) {
      console.error("Tool execution error", e);
      return { error: e.message };
    }
  };

  // --- Text Chat Handler ---
  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: input, 
        timestamp: Date.now(),
        image: attachment?.preview
    };
    
    setMessages(prev => [...prev, userMsg]);
    const currentAttachment = attachment; // Capture for async
    setInput('');
    setAttachment(null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const model = getGeminiModel();
      
      const history = messages.filter(m => m.role !== 'system').map(m => {
        const parts: any[] = [];
        if (m.image) {
            // Note: We can't easily reconstruct the base64 from just the preview URL if it was a blob URL
            // In a real app we would store the base64 in history or re-fetch. 
            // For this demo, we skip sending old images to history to keep it simple, 
            // or assume text context is enough.
            parts.push({ text: `[User sent an image] ${m.text}` }); 
        } else {
            parts.push({ text: m.text });
        }
        return {
            role: m.role === 'model' ? 'model' : 'user',
            parts
        };
      });

      const currentParts: any[] = [];
      if (currentAttachment) {
          const base64 = await fileToBase64(currentAttachment.file);
          currentParts.push({
              inlineData: {
                  mimeType: currentAttachment.file.type,
                  data: base64
              }
          });
      }
      if (userMsg.text) currentParts.push({ text: userMsg.text });

      history.push({ role: 'user', parts: currentParts });

      const tools = [{ functionDeclarations: createToolDeclarations() }];

      const result = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
        config: { 
            tools,
            systemInstruction: `You are the AI Operations Manager for Starter Box Studios. You have access to the CRM database.
            If the user provides an image, analyze it in the context of golf course products, scorecards, or data entry.
            Always be concise.`,
        }
      });

      const response = result.candidates?.[0]?.content;
      const parts = response?.parts || [];
      let finalResponseText = "";
      
      const functionCalls = parts
        .filter(p => p.functionCall)
        .map(p => p.functionCall!);

      if (functionCalls.length > 0) {
         const functionResponses = [];

         for (const call of functionCalls) {
            const functionResult = await executeTool(call.name, call.args);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: functionResult }
              }
            });
         }

         const result2 = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              ...history,
              { role: 'model', parts: parts },
              { role: 'user', parts: functionResponses }
            ],
            config: { tools }
         });
         
         finalResponseText = result2.text || "I've completed that request.";
         await refreshData(); 
      } else {
        finalResponseText = result.text || "I couldn't process that request.";
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: finalResponseText, timestamp: Date.now() }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Error: ${error.message}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Live Voice Handler ---
  const startLiveSession = async () => {
    try {
        setErrorMessage(null);
        setIsLiveActive(true);
        setIsLoading(true);
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();

        inputAudioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;
        nextStartTimeRef.current = 0;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                // Enable transcriptions to show text history
                inputAudioTranscription: { model: "gemini-2.5-flash" },
                outputAudioTranscription: { model: "gemini-2.5-flash" },
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
                },
                systemInstruction: "You are the voice assistant for Starter Box CRM. Be concise, helpful, and professional. When queried about data, use the provided tools. Speak naturally.",
                tools: [{ functionDeclarations: createToolDeclarations() }],
            },
            callbacks: {
                onopen: () => {
                    console.log("Live Session Opened");
                    setIsLoading(false);
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Voice session active. I am listening...', timestamp: Date.now() }]);

                    const source = inputCtx.createMediaStreamSource(stream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    processorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        
                        let sum = 0;
                        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                        const rms = Math.sqrt(sum / inputData.length);
                        setAudioLevel(Math.min(100, rms * 400));

                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const content = msg.serverContent;

                    // Handle Transcription (User Input)
                    if (content?.inputTranscription) {
                        currentInputTranscription.current += content.inputTranscription.text;
                    }

                    // Handle Transcription (Model Output)
                    if (content?.outputTranscription) {
                        currentOutputTranscription.current += content.outputTranscription.text;
                    }

                    // Handle Turn Completion - commit text to chat history
                    if (content?.turnComplete) {
                        if (currentInputTranscription.current.trim()) {
                             setMessages(prev => [...prev, { 
                                 id: `user-${Date.now()}`, 
                                 role: 'user', 
                                 text: currentInputTranscription.current, 
                                 timestamp: Date.now() 
                             }]);
                             currentInputTranscription.current = '';
                        }
                        if (currentOutputTranscription.current.trim()) {
                             setMessages(prev => [...prev, { 
                                 id: `model-${Date.now()}`, 
                                 role: 'model', 
                                 text: currentOutputTranscription.current, 
                                 timestamp: Date.now() 
                             }]);
                             currentOutputTranscription.current = '';
                        }
                    }

                    // Handle Audio Output
                    const audioData = content?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current) {
                        setIsBotSpeaking(true);
                        
                        if (botSpeakingTimeoutRef.current) clearTimeout(botSpeakingTimeoutRef.current);
                        botSpeakingTimeoutRef.current = setTimeout(() => setIsBotSpeaking(false), 1000);

                        const ctx = outputAudioContextRef.current;
                        if (ctx.state === 'suspended') await ctx.resume();

                        const currentTime = ctx.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        
                        const audioBuffer = await decodeAudioData(
                            decode(audioData),
                            ctx,
                            24000,
                            1
                        );
                        
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.start(nextStartTimeRef.current);
                        
                        sourceRefs.current.add(source);
                        source.onended = () => {
                            sourceRefs.current.delete(source);
                        };
                        
                        nextStartTimeRef.current += audioBuffer.duration;
                    }

                    // Handle Tool Calls
                    if (msg.toolCall) {
                        console.log("Live Tool Call Received:", msg.toolCall);
                        for (const fc of msg.toolCall.functionCalls) {
                            // Show tool execution in chat
                            setMessages(prev => [...prev, { 
                                id: `sys-${Date.now()}`, 
                                role: 'system', 
                                text: `Executing tool: ${fc.name}`, 
                                timestamp: Date.now() 
                            }]);

                            const result = await executeTool(fc.name, fc.args);
                            
                            sessionPromise.then(session => session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result }
                                }
                            }));
                        }
                        await refreshData();
                    }
                },
                onclose: () => {
                    console.log("Live Session Closed");
                    stopLiveSession();
                },
                onerror: (e) => {
                    console.error("Live Session Error", e);
                    setErrorMessage("Connection error. Please check microphone permissions.");
                    stopLiveSession();
                }
            }
        });
        
        liveSessionRef.current = await sessionPromise;

    } catch (err: any) {
        console.error("Failed to start live session", err);
        setIsLiveActive(false);
        setIsLoading(false);
        setErrorMessage(`Microphone access failed: ${err.message}`);
    }
  };

  const stopLiveSession = () => {
      liveSessionRef.current?.close();
      
      if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
      
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      sourceRefs.current.forEach(source => source.stop());
      sourceRefs.current.clear();
      
      setIsLiveActive(false);
      setIsBotSpeaking(false);
      setAudioLevel(0);
      
      // Clear buffers
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Voice session ended.', timestamp: Date.now() }]);
  };

  // Clean up on unmount
  useEffect(() => {
      return () => {
          if (isLiveActive) stopLiveSession();
      };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className={`px-4 py-3 border-b border-gray-200 flex items-center justify-between ${isLiveActive ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${isLiveActive ? 'text-green-600' : 'text-gray-600'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${isLiveActive ? 'text-green-800' : 'text-gray-600'}`}>
                {isLiveActive ? 'Live Voice Session' : 'Data Assistant'}
            </span>
            {isLiveActive && <span className="flex h-2 w-2 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>}
        </div>
        {isLiveActive && (
            <button onClick={stopLiveSession} className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                <XCircle size={14}/> End Session
            </button>
        )}
      </div>
      
      {/* Error Banner */}
      {errorMessage && (
          <div className="bg-red-50 px-4 py-2 text-xs text-red-700 flex items-center gap-2 border-b border-red-100">
              <AlertCircle size={12} />
              {errorMessage}
          </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mx-2 mt-1 ${
                  msg.role === 'system' ? 'bg-gray-400' :
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {msg.role === 'user' ? <User size={12} className="text-white" /> : 
                 msg.role === 'system' ? <Sparkles size={12} className="text-white" /> :
                 <Bot size={12} className="text-white" />}
              </div>
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Image Attachment Display */}
                  {msg.image && (
                      <div className="mb-1 overflow-hidden rounded-lg border border-gray-200 shadow-sm max-w-[200px]">
                          <img src={msg.image} alt="User upload" className="w-full h-auto" />
                      </div>
                  )}
                  {/* Text Message */}
                  {msg.text && (
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'system' ? 'bg-gray-100 text-gray-500 italic text-xs' :
                        msg.role === 'user' ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-800'
                      }`}>
                        {msg.text}
                      </div>
                  )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && !isLiveActive && (
          <div className="flex justify-start ml-10">
             <div className="bg-gray-50 px-3 py-1.5 rounded-full">
                 <span className="text-xs text-gray-500 flex items-center gap-2">
                    <Sparkles size={10} className="animate-spin text-green-600"/>
                    Thinking...
                 </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white">
        {/* File Upload Preview */}
        {attachment && (
             <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 max-w-fit">
                 <div className="w-8 h-8 rounded overflow-hidden bg-gray-200">
                     <img src={attachment.preview} alt="Preview" className="w-full h-full object-cover"/>
                 </div>
                 <div className="flex flex-col">
                     <span className="text-xs text-gray-700 font-medium truncate max-w-[150px]">{attachment.file.name}</span>
                     <span className="text-[10px] text-gray-500">Attached</span>
                 </div>
                 <button onClick={clearAttachment} className="ml-2 text-gray-400 hover:text-red-500">
                     <X size={14} />
                 </button>
             </div>
        )}

        {isLiveActive ? (
            <div className="flex flex-col items-center justify-center py-4 gap-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-4 w-full px-8 justify-center">
                    {/* User Mic Visualizer */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-10 bg-gray-200 rounded-full w-2 overflow-hidden relative flex items-end">
                            <div className="w-full bg-green-500 transition-all duration-75 ease-out rounded-full" style={{ height: `${Math.min(100, audioLevel)}%` }}></div>
                        </div>
                        <span className="text-[10px] uppercase text-green-700 font-bold">You</span>
                    </div>

                    {/* Status Text */}
                    <div className="flex flex-col items-center w-32">
                        {isBotSpeaking ? (
                            <span className="text-blue-600 text-sm font-bold animate-pulse flex items-center gap-1"><Volume2 size={16}/> Speaking...</span>
                        ) : (
                            <span className="text-green-700 text-sm font-bold">Listening...</span>
                        )}
                    </div>

                    {/* Bot Speaking Visualizer (Fake simulation based on state) */}
                    <div className="flex flex-col items-center gap-1">
                         <div className="h-10 bg-gray-200 rounded-full w-2 overflow-hidden relative flex items-end">
                            <div className={`w-full bg-blue-500 transition-all duration-200 rounded-full ${isBotSpeaking ? 'animate-bounce h-3/4' : 'h-0'}`}></div>
                        </div>
                        <span className="text-[10px] uppercase text-blue-700 font-bold">Bot</span>
                    </div>
                </div>

                <button 
                    onClick={stopLiveSession}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-full shadow-sm hover:bg-red-50 border border-red-100 transition-colors text-xs font-bold"
                >
                    <MicOff size={14} /> STOP SESSION
                </button>
            </div>
        ) : (
            <div className="flex gap-2 items-end">
                 <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleAttachmentSelect}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
                    title="Attach Image"
                >
                    {attachment ? <ImageIcon size={18} className="text-blue-600" /> : <Paperclip size={18} />}
                </button>

                <button 
                    onClick={startLiveSession}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors group relative"
                    title="Start Voice Chat"
                >
                    <Mic size={18} className="group-hover:text-green-600"/>
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type or use voice..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-white text-sm transition-all"
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading}
                    className={`p-2 rounded-md text-white transition-colors shrink-0 ${isLoading ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    <Send size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
