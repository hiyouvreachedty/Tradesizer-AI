
import React from 'react';
import { PositionResult, DCAResult } from '../types';

interface ResultsCardProps {
  mode: 'RISK' | 'DCA';
  riskResult?: PositionResult;
  dcaResult?: DCAResult;
  onExecute?: () => void;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({ mode, riskResult, dcaResult, onExecute }) => {
  
  if (mode === 'RISK' && riskResult) {
    if (!riskResult.isValid) {
      return (
        <div className="mt-6 rounded-lg border border-red-900/50 bg-red-900/10 p-4">
          <p className="text-sm text-red-400 text-center">{riskResult.summary || "Enter valid parameters."}</p>
        </div>
      );
    }
    return (
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-indigo-600/20 border border-indigo-500/30 p-5 text-center transition-transform hover:scale-[1.02]">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Position Size</p>
            <p className="mt-2 text-3xl font-bold text-white">{riskResult.positionSizeShares}</p>
            <p className="text-xs text-indigo-200/60">Shares</p>
          </div>
          
          <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Max Dollar Risk</p>
            <p className="mt-2 text-3xl font-bold text-red-400">${riskResult.maxDollarRisk}</p>
            <p className="text-xs text-slate-500">At Stop Loss</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
             <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
              <span className="text-sm text-slate-400">Risk Per Share</span>
              <span className="font-mono text-white">${riskResult.riskPerShare}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic opacity-80 mt-3">
              "{riskResult.summary}"
            </p>
            <button 
               onClick={onExecute}
               className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Exec Paper Trade (Buy)
            </button>
        </div>
      </div>
    );
  }

  if (mode === 'DCA' && dcaResult) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/30 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">New Average Price</p>
          <p className="mt-2 text-3xl font-bold text-white">${dcaResult.newAvgPrice.toFixed(2)}</p>
          <p className="text-xs text-emerald-200/60">Break-even Point</p>
        </div>
        
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
             <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-400">New Total Shares</span>
              <span className="font-mono text-white">{dcaResult.newTotalShares}</span>
            </div>
             <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
              <span className="text-sm text-slate-400">Total Invested</span>
              <span className="font-mono text-white">${dcaResult.totalInvested.toFixed(2)}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic opacity-80 mt-3">
              "{dcaResult.summary}"
            </p>
             <button 
               onClick={onExecute}
               className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Accumulate (Paper Buy)
            </button>
        </div>
      </div>
    );
  }

  return null;
};
