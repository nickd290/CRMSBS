
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

export const createToolDeclarations = (): FunctionDeclaration[] => {
  return [
    {
      name: "log_new_order",
      description: "Log a new order row into the 'Orders' Google Sheet. Use this when the user confirms an order. It automatically creates an invoice entry as well.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING, description: "Name of the golf course or customer" },
          itemsDescription: { type: Type.STRING, description: "Summary of items (e.g., '500 Scorecards, 100 Pencils')" },
          estimatedTotal: { type: Type.NUMBER, description: "Total value of the order" }
        },
        required: ["customerName", "itemsDescription", "estimatedTotal"]
      }
    },
    {
      name: "check_sheet_status",
      description: "Check the status of pending invoices, recent production orders, or sample requests from the Sheets.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          queryType: { type: Type.STRING, enum: ["PENDING_INVOICES", "RECENT_ORDERS", "SAMPLE_REQUESTS"], description: "What kind of data to retrieve from the sheets" }
        },
        required: ["queryType"]
      }
    },
    {
      name: "find_golf_course",
      description: "Search the 'Customers' sheet for a specific golf course to get their ID, address, and contact details.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the golf course" }
        },
        required: ["name"]
      }
    },
    {
      name: "log_sample_request",
      description: "Add a new row to the 'Samples' sheet.",
      parameters: {
        type: Type.OBJECT,
        properties: {
           customerName: { type: Type.STRING },
           address: { type: Type.STRING },
           items: { type: Type.STRING }
        },
        required: ["customerName", "address", "items"]
      }
    },
    {
      name: "lookup_product",
      description: "Search the 'Products' sheet to check stock levels, pricing, or SKU for a specific item.",
      parameters: {
        type: Type.OBJECT,
        properties: {
            searchTerm: { type: Type.STRING, description: "Product name or SKU (e.g. 'Pencils', 'Scorecards', 'SC-001')" }
        },
        required: ["searchTerm"]
      }
    },
    {
      name: "get_invoice_details",
      description: "Get specific details for an invoice by its ID to see amount, status, or customer.",
      parameters: {
        type: Type.OBJECT,
        properties: {
            invoiceId: { type: Type.STRING, description: "The Invoice ID (e.g., '16' or 'INV-16')" }
        },
        required: ["invoiceId"]
      }
    }
  ];
};

export const getGeminiModel = () => {
  return ai.models;
};
