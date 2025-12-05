📈 TradeSizer AI
An intelligent position sizing calculator, DCA planner, and paper trading sandbox powered by Google Gemini.

![alt text](https://img.shields.io/badge/React-19-blue)
![alt text](https://img.shields.io/badge/TypeScript-5.0-blue)
![alt text](https://img.shields.io/badge/Google-Gemini%202.5-orange)

📖 Overview
TradeSizer AI is a financial workspace designed to enforce discipline in trading. Unlike standard calculators, it combines deterministic math (exact position sizing formulas) with probabilistic AI reasoning (Gemini 2.5 Flash) to help traders manage risk.
It features a fully functional Paper Trading Engine with simulated live market data, allowing users to practice risk management and Dollar Cost Averaging (DCA) strategies before connecting to a live broker.

✨ Key Features

🧠 AI Risk Assistant (Gemini Integration)

Context-Aware: The AI knows your portfolio state and calculator inputs.
Function Calling: The AI can "control" the calculator. If you say "I want to risk 2% on a $50k account with entry at 150 and stop at 145," the AI automatically executes the math and updates the UI.
Multimodal Vision: Upload screenshots of charts. The AI analyzes the visual trend (support/resistance) and suggests stop-loss levels.

🛡️ Risk Management Module
Position Sizer: Instantly calculates share count based on Account Size, Max Risk %, Entry, and Stop Loss.
Capital Preservation: Enforces the "1% Rule" logic to prevent account blowouts.

📉 DCA (Dollar Cost Averaging) Planner
Calculates new average price and break-even points when adding to a losing position.
Visualizes the impact of new capital on existing holdings.

🎮 Paper Trading Sandbox
Simulated Portfolio: Tracks Cash, Equity, and P/L.
Live Market Simulation: A mock WebSocket service simulates NASDAQ price action with realistic volatility, updating portfolio values in real-time.
Visual Feedback: UI flashes green/red on price ticks (tick-by-tick updates).

🏗️ Architecture & Design Patterns

This project is architected for scalability and future backend integration.

1. The Service Layer Pattern
The app uses an interface-based design to decouple the UI from the execution logic. This is critical for the roadmap to Webull or Algo Trading.
code
TypeScript
// services/tradingService.ts

export interface ITradingProvider {
  getPortfolio(): Promise<Portfolio>;
  placeOrder(symbol: string, side: 'BUY' | 'SELL', ...): Promise<Portfolio>;
}
Current State: Uses PaperTradingService (Local memory mock).
Future State: Swap this with WebullService (API calls to a Python/Node proxy) without changing a single line of React code.

2. Observer Pattern (Market Data)
The MarketDataService uses a subscription model. Components (like the Portfolio Card) subscribe to specific ticker symbols and receive push updates, minimizing re-renders and mimicking a real WebSocket feed.

🚀 Getting Started
Prerequisites
Node.js (v18+)
A Google Gemini API Key (Get one here)
Installation
Clone the repository
code
Bash
git clone https://github.com/yourusername/tradesizer-ai.git
cd tradesizer-ai
Install dependencies
code
Bash
npm install
Set up Environment Variables
Create a .env file in the root:
code
Env
# The app expects the key to be injected or available in the environment
API_KEY=your_gemini_api_key_here
Run the application
code
Bash
npm start
🗺️ Roadmap: From Paper to Algo
The current application is the Frontend & Logic Layer. The path to a full Algo/Webull bot involves the following steps:

Phase 1: Logic Core (Completed) - Risk calculations, AI reasoning, and UI.

Phase 2: Simulation (Completed) - Paper trading engine and mock data feeds.

Phase 3: Backend Proxy - Create a Python (FastAPI) or Node.js server to handle CORS and hold secrets.

Phase 4: Webull Integration - Implement webull-python-sdk in the backend proxy. Connect the frontend ITradingProvider to this API.

Phase 5: Automation - Move the logic from "Click to Buy" to "AI Triggered Buy" based on Gemini's market analysis.

🤝 Contributing

Contributions are welcome! specifically looking for help with:

Implementing the WebullService bridge.

Adding technical indicator libraries (RSI, MACD) for the AI to analyze.

📄 License
MIT
