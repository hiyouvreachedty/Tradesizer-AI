
import { Portfolio, Holding } from '../types';

/**
 * Interface that both PaperTrading and WebullService must implement.
 * This allows swapping the backend without breaking the UI.
 */
export interface ITradingProvider {
  getPortfolio(): Promise<Portfolio>;
  placeOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): Promise<Portfolio>;
  updateLivePrices(updates: Record<string, number>): void;
}

// Initial Mock State
let mockPortfolio: Portfolio = {
  cash: 100000, // Paper money starting balance
  holdings: [
    { symbol: 'AAPL', shares: 50, avgPrice: 150.00, currentPrice: 175.00 },
    { symbol: 'TSLA', shares: 10, avgPrice: 220.00, currentPrice: 200.00 },
  ],
  totalEquity: 0 // Calculated dynamically
};

/**
 * Paper Trading Implementation (Local State)
 */
export const PaperTradingService: ITradingProvider = {
  
  async getPortfolio(): Promise<Portfolio> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Recalculate equity
    const holdingsValue = mockPortfolio.holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
    mockPortfolio.totalEquity = mockPortfolio.cash + holdingsValue;
    
    return { ...mockPortfolio };
  },

  async placeOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): Promise<Portfolio> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (side === 'BUY') {
      const cost = quantity * price;
      if (cost > mockPortfolio.cash) {
        throw new Error("Insufficient buying power for paper trade.");
      }

      mockPortfolio.cash -= cost;
      
      const existingHolding = mockPortfolio.holdings.find(h => h.symbol === symbol);
      if (existingHolding) {
        // DCA Math
        const totalCost = (existingHolding.shares * existingHolding.avgPrice) + cost;
        const totalShares = existingHolding.shares + quantity;
        existingHolding.shares = totalShares;
        existingHolding.avgPrice = totalCost / totalShares;
        existingHolding.currentPrice = price; // Update current price to execution price
      } else {
        mockPortfolio.holdings.push({
          symbol,
          shares: quantity,
          avgPrice: price,
          currentPrice: price
        });
      }
    } 
    // Simplified Sell logic for brevity
    else if (side === 'SELL') {
      const existingHolding = mockPortfolio.holdings.find(h => h.symbol === symbol);
      if (!existingHolding || existingHolding.shares < quantity) {
        throw new Error("Insufficient shares to sell.");
      }
      
      mockPortfolio.cash += quantity * price;
      existingHolding.shares -= quantity;
      existingHolding.currentPrice = price;
      
      // Remove if 0
      if (existingHolding.shares === 0) {
        mockPortfolio.holdings = mockPortfolio.holdings.filter(h => h.symbol !== symbol);
      }
    }

    // Recalculate
    const holdingsValue = mockPortfolio.holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
    mockPortfolio.totalEquity = mockPortfolio.cash + holdingsValue;

    return { ...mockPortfolio };
  },

  /**
   * Syncs the "Backend" state with live prices received from MarketDataService.
   * This ensures that when we click buy/sell, we aren't using stale data from the initial load.
   */
  updateLivePrices(updates: Record<string, number>) {
    let equityUpdated = false;
    
    mockPortfolio.holdings.forEach(h => {
        if (updates[h.symbol]) {
            h.currentPrice = updates[h.symbol];
            equityUpdated = true;
        }
    });

    if (equityUpdated) {
        const holdingsValue = mockPortfolio.holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
        mockPortfolio.totalEquity = mockPortfolio.cash + holdingsValue;
    }
  }
};
