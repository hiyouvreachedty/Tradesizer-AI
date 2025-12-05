
import React, { useEffect, useState } from 'react';
import { Portfolio, Holding } from '../types';

interface PortfolioCardProps {
  portfolio: Portfolio;
  refreshPortfolio: () => void;
}

// Helper for row component to track previous price
const PortfolioRow: React.FC<{ holding: Holding }> = ({ holding }) => {
  const [prevPrice, setPrevPrice] = useState(holding.currentPrice);
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);

  useEffect(() => {
    if (holding.currentPrice > prevPrice) {
      setFlash('green');
      setTimeout(() => setFlash(null), 1000);
    } else if (holding.currentPrice < prevPrice) {
      setFlash('red');
      setTimeout(() => setFlash(null), 1000);
    }
    setPrevPrice(holding.currentPrice);
  }, [holding.currentPrice]);

  const pl = (holding.currentPrice - holding.avgPrice) * holding.shares;
  const isProfit = pl >= 0;
  
  let priceColor = 'text-white';
  if (flash === 'green') priceColor = 'text-green-400 transition-colors duration-300';
  if (flash === 'red') priceColor = 'text-red-400 transition-colors duration-300';

  return (
    <div className="flex justify-between items-center bg-slate-800/40 p-2 rounded-md hover:bg-slate-800/60 transition-colors">
       <div>
          <span className="font-bold text-sm text-white">{holding.symbol}</span>
          <div className="text-xs text-slate-400">{holding.shares} shares @ ${holding.avgPrice.toFixed(2)}</div>
       </div>
       <div className="text-right">
          <div className={`text-sm font-mono ${priceColor}`}>${holding.currentPrice.toFixed(2)}</div>
          <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{pl.toFixed(2)}
          </div>
       </div>
    </div>
  );
};

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, refreshPortfolio }) => {
  
  // Calculate total daily P/L (Simulated based on Avg Price for now, 
  // in reality would be open price vs current)
  const totalPL = portfolio.holdings.reduce((sum, h) => {
     return sum + ((h.currentPrice - h.avgPrice) * h.shares);
  }, 0);

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-lg overflow-hidden mb-6">
      <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <div>
           <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Paper Portfolio</h2>
           <p className="text-xs text-slate-400">Simulated Webull Account</p>
        </div>
        <button onClick={refreshPortfolio} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors">
          Sync
        </button>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-800">
         <div>
            <p className="text-xs text-slate-500">Buying Power</p>
            <p className="text-lg font-mono font-bold text-white">${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
         </div>
         <div>
            <p className="text-xs text-slate-500">Total Equity</p>
            <div className="flex items-baseline gap-2">
                <p className="text-lg font-mono font-bold text-indigo-400">${portfolio.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <p className={`text-xs ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               {totalPL >= 0 ? '+' : ''}{totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Unrealized
            </p>
         </div>
      </div>

      <div className="p-4">
        <h3 className="text-xs text-slate-500 mb-2">Positions</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
          {portfolio.holdings.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No positions open.</p>
          ) : (
            portfolio.holdings.map((h) => (
                <PortfolioRow key={h.symbol} holding={h} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
