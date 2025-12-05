
import { Holding } from '../types';

type PriceUpdateCallback = (updates: Record<string, number>) => void;

class MockMarketSocket {
  private subscribers: Set<PriceUpdateCallback> = new Set();
  private activeSymbols: Set<string> = new Set();
  private prices: Map<string, number> = new Map();
  private intervalId: any = null;
  private isMarketOpen: boolean = true;

  constructor() {
    // Seed some initial realistic prices for common tickers
    this.prices.set('AAPL', 175.00);
    this.prices.set('TSLA', 200.00);
    this.prices.set('NVDA', 850.00);
    this.prices.set('AMD', 160.00);
    this.prices.set('MSFT', 410.00);
    this.prices.set('GOOGL', 170.00);
    this.prices.set('MOCK-SYM', 150.00);
    this.prices.set('MOCK-DCA', 180.00);
  }

  /**
   * Start the simulation loop
   */
  public connect() {
    if (this.intervalId) return;

    console.log("🔌 Connecting to NASDAQ Feed (Simulated)...");
    
    // Update every 1.5 seconds to mimic a throttled live feed
    this.intervalId = setInterval(() => {
      if (!this.isMarketOpen || this.activeSymbols.size === 0) return;

      const updates: Record<string, number> = {};
      let hasUpdates = false;

      this.activeSymbols.forEach(symbol => {
        // 50% chance to update a specific symbol on any given tick (not everything moves at once)
        if (Math.random() > 0.5) {
          const currentPrice = this.prices.get(symbol) || 100;
          
          // Random Walk: Move between -0.15% and +0.15%
          const volatility = 0.0015; 
          const direction = Math.random() > 0.48 ? 1 : -1; // Slight upward bias for stonks
          const changePct = Math.random() * volatility * direction;
          const changeAmount = currentPrice * changePct;
          
          let newPrice = currentPrice + changeAmount;
          newPrice = Math.max(0.01, newPrice); // No negative prices

          this.prices.set(symbol, newPrice);
          updates[symbol] = newPrice;
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        this.notify(updates);
      }

    }, 1500);
  }

  public disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public subscribe(symbols: string[], callback: PriceUpdateCallback) {
    symbols.forEach(s => {
        this.activeSymbols.add(s);
        // If we don't have a price for it yet, generate a random one around 100
        if (!this.prices.has(s)) {
            this.prices.set(s, 100 + (Math.random() * 50));
        }
    });
    this.subscribers.add(callback);
    
    // Immediately send current known prices for these symbols
    const initial: Record<string, number> = {};
    symbols.forEach(s => {
        initial[s] = this.prices.get(s)!;
    });
    callback(initial);
  }

  public unsubscribe(callback: PriceUpdateCallback) {
    this.subscribers.delete(callback);
  }

  public updateWatchedSymbols(symbols: string[]) {
    this.activeSymbols.clear();
    symbols.forEach(s => this.activeSymbols.add(s));
  }

  private notify(updates: Record<string, number>) {
    this.subscribers.forEach(cb => cb(updates));
  }

  public getPrice(symbol: string): number {
      return this.prices.get(symbol) || 0;
  }
}

export const MarketDataService = new MockMarketSocket();
