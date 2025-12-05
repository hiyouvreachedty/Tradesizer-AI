
import { PositionInputs, PositionResult, DCAInputs, DCAResult } from '../types';

/**
 * Calculate position size so that loss between entry and stop
 * is <= max_risk_pct of the total account.
 */
export const calculatePositionSize = (inputs: PositionInputs): PositionResult => {
  const { accountSize, maxRiskPct, entryPrice, stopPrice } = inputs;

  if (entryPrice <= 0 || stopPrice <= 0 || accountSize <= 0) {
     return {
        maxDollarRisk: 0,
        positionSizeShares: 0,
        riskPerShare: 0,
        summary: "Prices and account size must be positive numbers.",
        isValid: false,
        error: "Values must be positive."
     };
  }

  const maxDollarRisk = accountSize * (maxRiskPct / 100.0);
  const riskPerShare = Math.abs(entryPrice - stopPrice);

  if (riskPerShare === 0) {
    return {
        maxDollarRisk: 0,
        positionSizeShares: 0,
        riskPerShare: 0,
        summary: "Entry and stop price cannot be the same.",
        isValid: false,
        error: "Invalid spread."
     };
  }

  const positionSizeShares = Math.floor(maxDollarRisk / riskPerShare);
  const summary = `With a $${accountSize.toFixed(2)} account and ${maxRiskPct.toFixed(2)}% max risk, you can risk up to $${maxDollarRisk.toFixed(2)}. At an entry of $${entryPrice.toFixed(2)} and stop at $${stopPrice.toFixed(2)}, risk per share is $${riskPerShare.toFixed(2)}, so you can buy ${positionSizeShares} shares.`;

  return {
    maxDollarRisk: Number(maxDollarRisk.toFixed(2)),
    riskPerShare: Number(riskPerShare.toFixed(2)),
    positionSizeShares: positionSizeShares,
    summary,
    isValid: true
  };
};

/**
 * Calculates the new average price after a purchase (Dollar Cost Averaging).
 */
export const calculateDCA = (inputs: DCAInputs): DCAResult => {
  const { currentShares, currentAvgPrice, newPrice, investAmount } = inputs;
  
  const newShares = Math.floor(investAmount / newPrice);
  const totalShares = currentShares + newShares;
  const currentTotalValue = currentShares * currentAvgPrice;
  const newInvestmentValue = newShares * newPrice;
  const totalInvested = currentTotalValue + newInvestmentValue;
  
  const newAvgPrice = totalShares > 0 ? totalInvested / totalShares : 0;

  return {
    newTotalShares: totalShares,
    newAvgPrice: Number(newAvgPrice.toFixed(2)),
    totalInvested: Number(totalInvested.toFixed(2)),
    summary: `Buying ${newShares} shares at $${newPrice} brings your average from $${currentAvgPrice} to $${newAvgPrice.toFixed(2)}.`
  };
};
