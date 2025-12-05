
export interface PositionInputs {
  accountSize: number;
  maxRiskPct: number;
  entryPrice: number;
  stopPrice: number;
}

export interface PositionResult {
  maxDollarRisk: number;
  positionSizeShares: number;
  riskPerShare: number;
  summary: string;
  isValid: boolean;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum CalculationField {
  ACCOUNT = 'accountSize',
  RISK = 'maxRiskPct',
  ENTRY = 'entryPrice',
  STOP = 'stopPrice'
}

// --- DCA & Portfolio Types ---

export interface DCAInputs {
  currentShares: number;
  currentAvgPrice: number;
  newPrice: number;
  investAmount: number;
}

export interface DCAResult {
  newTotalShares: number;
  newAvgPrice: number;
  totalInvested: number;
  summary: string;
}

export interface Holding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number; // Last known price
}

export interface Portfolio {
  cash: number;
  holdings: Holding[];
  totalEquity: number;
}
