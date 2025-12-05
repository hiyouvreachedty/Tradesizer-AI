
import React, { useState, useEffect, useRef } from 'react';
import { calculatePositionSize, calculateDCA } from './utils/math';
import { PositionInputs, PositionResult, ChatMessage, Portfolio, DCAInputs, DCAResult } from './types';
import { InputGroup } from './components/InputGroup';
import { ResultsCard } from './components/ResultsCard';
import { PortfolioCard } from './components/PortfolioCard';
import { createChatSession, sendMessageToGemini, ImageAttachment } from './services/geminiService';
import { PaperTradingService } from './services/tradingService';
import { MarketDataService } from './services/marketDataService';

export default function App() {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<'RISK' | 'DCA'>('RISK');
  const [portfolio, setPortfolio] = useState<Portfolio>({ cash: 0, holdings: [], totalEquity: 0 });

  // --- Risk Calc State ---
  const [riskInputs, setRiskInputs] = useState<PositionInputs>({
    accountSize: 10000,
    maxRiskPct: 1.0,
    entryPrice: 150.00,
    stopPrice: 145.00
  });
  const [riskResult, setRiskResult] = useState<PositionResult>(calculatePositionSize(riskInputs));

  // --- DCA Calc State ---
  const [dcaInputs, setDcaInputs] = useState<DCAInputs>({
    currentShares: 10,
    currentAvgPrice: 200,
    newPrice: 180,
    investAmount: 5000
  });
  const [dcaResult, setDcaResult] = useState<DCAResult>(calculateDCA(dcaInputs));

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am ready to help you plan your trades, calculate risk, or plan a DCA strategy. Upload a chart to get started!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageAttachment | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  
  // Refs
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  
  // 1. Initialize Market Data Connection
  useEffect(() => {
    MarketDataService.connect();
    return () => MarketDataService.disconnect();
  }, []);

  // 2. Load Portfolio on Mount
  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    const data = await PaperTradingService.getPortfolio();
    setPortfolio(data);
    // If we have portfolio data, update the default account size
    if (data.totalEquity > 0 && activeTab === 'RISK') {
       setRiskInputs(prev => ({...prev, accountSize: data.totalEquity }));
    }
  };

  // 3. Subscribe to Real-time Prices for Holdings
  useEffect(() => {
    if (portfolio.holdings.length === 0) return;

    const symbols = portfolio.holdings.map(h => h.symbol);
    
    // Update the service on which symbols we care about
    MarketDataService.updateWatchedSymbols(symbols);

    const handlePriceUpdate = (updates: Record<string, number>) => {
      // 1. Sync backend state (so next trade uses fresh prices)
      PaperTradingService.updateLivePrices(updates);

      // 2. Sync Frontend State (Visuals)
      setPortfolio(prevPortfolio => {
         const newHoldings = prevPortfolio.holdings.map(h => {
            if (updates[h.symbol] !== undefined) {
               return { ...h, currentPrice: updates[h.symbol] };
            }
            return h;
         });
         
         // Recalculate Equity
         const holdingsValue = newHoldings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
         const totalEquity = prevPortfolio.cash + holdingsValue;

         return {
            ...prevPortfolio,
            holdings: newHoldings,
            totalEquity
         };
      });
    };

    MarketDataService.subscribe(symbols, handlePriceUpdate);

    return () => {
      MarketDataService.unsubscribe(handlePriceUpdate);
    };
  }, [portfolio.holdings.length]); // Re-sub if symbols list changes (added/removed holding)


  // Recalculate Risk
  useEffect(() => {
    setRiskResult(calculatePositionSize(riskInputs));
  }, [riskInputs]);

  // Recalculate DCA
  useEffect(() => {
    setDcaResult(calculateDCA(dcaInputs));
  }, [dcaInputs]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Initialize Chat Session
  useEffect(() => {
    try {
      chatSessionRef.current = createChatSession();
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  // --- Handlers ---

  const handleRiskChange = (field: keyof PositionInputs, value: number) => {
    setRiskInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleDcaChange = (field: keyof DCAInputs, value: number) => {
    setDcaInputs(prev => ({ ...prev, [field]: value }));
  };

  const handlePaperTrade = async () => {
    // Determine which calculation to use based on active tab
    try {
      if (activeTab === 'RISK') {
        if (!riskResult.isValid) return;
        const confirm = window.confirm(`Place PAPER trade for ${riskResult.positionSizeShares} shares?`);
        if (confirm) {
           const updated = await PaperTradingService.placeOrder(
              "MOCK-SYM", // In real app, user selects symbol
              'BUY',
              riskResult.positionSizeShares,
              riskInputs.entryPrice
           );
           setPortfolio(updated);
           alert("Paper trade executed!");
        }
      } else {
        const newShares = Math.floor(dcaInputs.investAmount / dcaInputs.newPrice);
        const confirm = window.confirm(`Place PAPER DCA buy for ${newShares} shares?`);
        if (confirm) {
           const updated = await PaperTradingService.placeOrder(
              "MOCK-DCA", // In real app, user selects symbol
              'BUY',
              newShares,
              dcaInputs.newPrice
           );
           setPortfolio(updated);
           alert("Paper trade executed!");
        }
      }
    } catch (e: any) {
      alert(`Trade failed: ${e.message}`);
    }
  };

  // --- Chat Handlers (Same as before) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({ mimeType: file.type, data: base64String });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = () => setSelectedImage(null);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !chatSessionRef.current) return;
    const displayUserInfo = selectedImage ? `[Uploaded Image] ${inputText}` : inputText;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: displayUserInfo };
    setMessages(prev => [...prev, userMsg]);
    
    const textToSend = inputText;
    const imageToSend = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsThinking(true);

    try {
      const responseText = await sendMessageToGemini(
        chatSessionRef.current,
        textToSend,
        imageToSend,
        (newInputs, newResult) => {
          // If AI tool updates Risk Calculator
          setRiskInputs(newInputs);
          setRiskResult(newResult);
          setActiveTab('RISK');
        }
      );
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error connecting to AI.", isError: true }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">TradeSizer AI</h1>
              <p className="text-xs text-slate-400">Paper Trading & Algo Prep</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               </span>
               <span className="text-xs text-slate-300 font-medium tracking-wide">NASDAQ LIVE</span>
             </div>
            <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-400">
               Webull: <span className="text-amber-500">Mock Mode</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Left Column: Tools */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Portfolio Widget */}
            <PortfolioCard portfolio={portfolio} refreshPortfolio={loadPortfolio} />

            {/* Main Calculator Card */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button 
                  onClick={() => setActiveTab('RISK')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'RISK' ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Risk Sizer
                </button>
                <button 
                   onClick={() => setActiveTab('DCA')}
                   className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'DCA' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  DCA Planner
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* RISK MODE UI */}
                {activeTab === 'RISK' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputGroup 
                        label="Account Equity" 
                        value={riskInputs.accountSize} 
                        onChange={(v) => handleRiskChange('accountSize', v)}
                        prefix="$"
                        step={100}
                      />
                      <InputGroup 
                        label="Max Risk" 
                        value={riskInputs.maxRiskPct} 
                        onChange={(v) => handleRiskChange('maxRiskPct', v)}
                        suffix="%"
                        step={0.1}
                      />
                    </div>
                    <div className="relative py-2">
                       <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-800"></div>
                       </div>
                       <div className="relative flex justify-center">
                        <span className="bg-slate-900 px-2 text-xs text-slate-500 uppercase tracking-widest">Trade Setup</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputGroup 
                        label="Entry Price" 
                        value={riskInputs.entryPrice} 
                        onChange={(v) => handleRiskChange('entryPrice', v)}
                        prefix="$"
                      />
                      <InputGroup 
                        label="Stop Loss" 
                        value={riskInputs.stopPrice} 
                        onChange={(v) => handleRiskChange('stopPrice', v)}
                        prefix="$"
                      />
                    </div>
                    <ResultsCard mode="RISK" riskResult={riskResult} onExecute={handlePaperTrade} />
                  </>
                )}

                {/* DCA MODE UI */}
                {activeTab === 'DCA' && (
                  <>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputGroup 
                        label="Current Shares" 
                        value={dcaInputs.currentShares} 
                        onChange={(v) => handleDcaChange('currentShares', v)}
                        step={1}
                      />
                      <InputGroup 
                        label="Avg Price" 
                        value={dcaInputs.currentAvgPrice} 
                        onChange={(v) => handleDcaChange('currentAvgPrice', v)}
                        prefix="$"
                      />
                    </div>
                    <div className="relative py-2">
                       <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-800"></div>
                       </div>
                       <div className="relative flex justify-center">
                        <span className="bg-slate-900 px-2 text-xs text-slate-500 uppercase tracking-widest">Accumulation</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputGroup 
                        label="New Buy Price" 
                        value={dcaInputs.newPrice} 
                        onChange={(v) => handleDcaChange('newPrice', v)}
                        prefix="$"
                      />
                      <InputGroup 
                        label="Invest Amount" 
                        value={dcaInputs.investAmount} 
                        onChange={(v) => handleDcaChange('investAmount', v)}
                        prefix="$"
                        step={100}
                      />
                    </div>
                    <ResultsCard mode="DCA" dcaResult={dcaResult} onExecute={handlePaperTrade} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Chat (Unchanged layout) */}
          <div className="lg:col-span-7 h-[600px] lg:h-[calc(100vh-10rem)] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">AI Risk Assistant</h2>
                <p className="text-sm text-slate-400">Analysis & Strategy Planning</p>
              </div>
              <div className="flex items-center space-x-2">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs text-green-500 font-medium">Online</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[#0b1221]">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                      ${msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                      }
                      ${msg.isError ? 'bg-red-900/50 border-red-700 text-red-200' : ''}
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex space-x-1.5 items-center">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
              {selectedImage && (
                <div className="mb-3 flex items-start">
                   <div className="relative group">
                     <img 
                       src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                       alt="Preview" 
                       className="h-20 w-auto rounded-lg border border-slate-700 shadow-md object-cover" 
                     />
                     <button 
                       onClick={removeImage}
                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                       </svg>
                     </button>
                   </div>
                </div>
              )}

              <div className="relative flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                  title="Upload chart image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Gemini to analyze your portfolio..."
                  className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded-xl pr-12 py-3 pl-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-14 scrollbar-hide text-sm"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={isThinking || (!inputText.trim() && !selectedImage)}
                  className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
