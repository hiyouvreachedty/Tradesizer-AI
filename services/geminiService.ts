import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { PositionInputs, PositionResult } from "../types";
import { calculatePositionSize } from "../utils/math";

// 1. Define the Tool Schema
const sizePositionTool: FunctionDeclaration = {
  name: "size_position",
  description: "Given account size, risk percent, entry, and stop, calculate how many shares the user can buy while keeping risk under the chosen percent of the total account.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      account_size: {
        type: Type.NUMBER,
        description: "The total equity in the trading account."
      },
      max_risk_pct: {
        type: Type.NUMBER,
        description: "The percentage of the account to risk on this single trade (e.g., 1.0 for 1%)."
      },
      entry_price: {
        type: Type.NUMBER,
        description: "The price at which the trade is entered."
      },
      stop_price: {
        type: Type.NUMBER,
        description: "The price at which the trade will be closed if it goes wrong (stop loss)."
      }
    },
    required: ["account_size", "max_risk_pct", "entry_price", "stop_price"]
  }
};

const tools: Tool[] = [{ functionDeclarations: [sizePositionTool] }];

// Initialize Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System Instruction
const SYSTEM_INSTRUCTION = `
You are an expert Trading Risk Manager. 
Always call the 'size_position' tool when the user asks how big a position to take or provides trade parameters. 
Use the returned summary to explain the plan clearly.
Never suggest risking more than the user's defined max_risk_pct (default to 1-2% if they don't specify, but ask first).
Be concise, professional, and focus on capital preservation.
If the user provides values, use the tool. If they ask for advice, explain the importance of position sizing.
If the user provides a chart or image, analyze the visual trends, support/resistance levels, and suggest potential entry/stop levels if asked, but always verify with the tool for sizing.
`;

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: tools,
    }
  });
};

export interface ImageAttachment {
  mimeType: string;
  data: string;
}

/**
 * Handles the chat interaction, including checking for function calls
 * and executing the local TypeScript logic if requested by the model.
 */
export const sendMessageToGemini = async (
  chatSession: any, 
  message: string,
  image: ImageAttachment | null,
  onToolCall: (inputs: PositionInputs, result: PositionResult) => void
): Promise<string> => {
  
  try {
    // 1. Send user message (text + optional image)
    let content: string | any[] = message;
    
    if (image) {
      content = [
        { text: message },
        { inlineData: { mimeType: image.mimeType, data: image.data } }
      ];
    }

    const result = await chatSession.sendMessage({ message: content });
    
    // 2. Check for function calls in the response
    const calls = result.functionCalls;
    
    if (calls && calls.length > 0) {
        const call = calls[0]; // Assuming single tool call for this use case
        
        if (call.name === 'size_position') {
            const args = call.args as any;
            
            // Map API args to our TS interface
            const inputs: PositionInputs = {
                accountSize: args.account_size,
                maxRiskPct: args.max_risk_pct,
                entryPrice: args.entry_price,
                stopPrice: args.stop_price
            };

            // Execute local logic
            const toolResult = calculatePositionSize(inputs);
            
            // Callback to update UI with these values
            onToolCall(inputs, toolResult);

            // 3. Send tool response back to model
            // We must use sendMessage with the functionResponse part
            const response = await chatSession.sendMessage({
                message: [{
                    functionResponse: {
                        id: call.id,
                        name: call.name,
                        response: { result: toolResult }
                    }
                }]
            });

            return response.text;
        }
    }

    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};