import { Router } from 'express';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

const router = Router();

// Initialize Gemini AI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey });
};

// Tool declarations (mirrored from frontend geminiService.ts)
const createToolDeclarations = (): FunctionDeclaration[] => {
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
    },
    {
      name: "check_recent_emails",
      description: "Check recent emails from connected Gmail accounts. Returns subject, sender, date, and preview. Useful for 'check my email' or 'any new messages'.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          maxResults: { type: Type.NUMBER, description: "Number of emails to retrieve (default 10, max 25)" },
          unreadOnly: { type: Type.BOOLEAN, description: "If true, only show unread emails (default false)" }
        },
        required: []
      }
    },
    {
      name: "search_customer_emails",
      description: "Find all emails related to a specific golf course customer by searching their name or email address.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING, description: "Name of the golf course to search for" },
          maxResults: { type: Type.NUMBER, description: "Number of emails to retrieve (default 20)" }
        },
        required: ["customerName"]
      }
    }
  ];
};

/**
 * POST /api/ai/chat
 * Handles text-based chat requests with Gemini
 *
 * Request body:
 * - messages: Chat history array
 * - crmData: { orders, customers, products, invoices, samples } for tool execution
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, crmData } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getAI();
    const model = ai.models;

    // Convert frontend message format to Gemini format
    const history = messages.map((m: any) => {
      const parts: any[] = [];

      if (m.image) {
        // Handle image attachments
        if (m.imageData) {
          parts.push({
            inlineData: {
              mimeType: m.imageMimeType || 'image/jpeg',
              data: m.imageData
            }
          });
        } else {
          parts.push({ text: `[User sent an image] ${m.text}` });
        }
      } else {
        parts.push({ text: m.text });
      }

      return {
        role: m.role === 'model' ? 'model' : 'user',
        parts
      };
    });

    const tools = [{ functionDeclarations: createToolDeclarations() }];

    // Initial Gemini call
    const result = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        tools,
        systemInstruction: `You are the AI Operations Manager for Starter Box Studios. You have access to the CRM database.
        If the user provides an image, analyze it in the context of golf course products, scorecards, or data entry.
        Always be concise.`,
      }
    });

    const response = result.candidates?.[0]?.content;
    const parts = response?.parts || [];

    // Check for function calls
    const functionCalls = parts
      .filter((p: any) => p.functionCall)
      .map((p: any) => p.functionCall);

    if (functionCalls.length > 0) {
      // Execute tools
      const functionResponses = [];

      for (const call of functionCalls) {
        const functionResult = await executeToolOnBackend(call.name, call.args, crmData);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: functionResult }
          }
        });
      }

      // Second Gemini call with tool results
      const result2 = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...history,
          { role: 'model', parts: parts },
          { role: 'user', parts: functionResponses }
        ],
        config: { tools }
      });

      const finalResponseText = result2.text || "I've completed that request.";

      return res.json({
        text: finalResponseText,
        toolsUsed: functionCalls.map((c: any) => c.name),
        refreshNeeded: functionCalls.some((c: any) =>
          ['log_new_order', 'log_sample_request'].includes(c.name)
        )
      });
    } else {
      // No tool calls, return direct response
      const finalResponseText = result.text || "I couldn't process that request.";
      return res.json({ text: finalResponseText });
    }

  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'AI processing failed',
      message: error.message
    });
  }
});

/**
 * Execute a tool function on the backend
 * This mirrors the executeTool function from ChatInterface.tsx
 */
async function executeToolOnBackend(
  name: string,
  args: any,
  crmData: {
    orders?: any[];
    customers?: any[];
    products?: any[];
    invoices?: any[];
    samples?: any[];
  }
) {
  try {
    const {
      orders = [],
      customers = [],
      products = [],
      invoices = [],
      samples = []
    } = crmData;

    if (name === 'log_new_order') {
      const { customerName, itemsDescription, estimatedTotal } = args;
      return {
        success: true,
        message: `Order logged for ${customerName}: ${itemsDescription} - $${estimatedTotal}`,
        action: 'create_order',
        data: { customerName, itemsDescription, estimatedTotal }
      };
    } else if (name === 'check_sheet_status') {
      const { queryType } = args;
      if (queryType === 'PENDING_INVOICES') {
        const pending = invoices.filter((inv: any) => inv.status === 'pending' || inv.status === 'sent');
        return {
          type: 'PENDING_INVOICES',
          count: pending.length,
          total: pending.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0),
          invoices: pending.slice(0, 5)
        };
      } else if (queryType === 'RECENT_ORDERS') {
        return {
          type: 'RECENT_ORDERS',
          count: orders.length,
          orders: orders.slice(0, 5)
        };
      } else if (queryType === 'SAMPLE_REQUESTS') {
        return {
          type: 'SAMPLE_REQUESTS',
          count: samples.length,
          samples: samples.slice(0, 5)
        };
      }
    } else if (name === 'find_golf_course') {
      const { name: searchName } = args;
      const course = customers.find((c: any) =>
        c.name.toLowerCase().includes(searchName.toLowerCase())
      );
      if (course) {
        return {
          found: true,
          course: {
            id: course.id,
            name: course.name,
            address: course.address,
            contact: course.contact
          }
        };
      }
      return { found: false, message: "Golf course not found in database" };
    } else if (name === 'log_sample_request') {
      const { customerName, address, items } = args;
      return {
        success: true,
        message: `Sample request logged for ${customerName} at ${address}`,
        action: 'create_sample',
        data: { customerName, address, items }
      };
    } else if (name === 'lookup_product') {
      const { searchTerm } = args;
      const product = products.find((p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (product) {
        return {
          found: true,
          product: {
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock
          }
        };
      }
      return { found: false, message: "Product not found in inventory" };
    } else if (name === 'get_invoice_details') {
      const { invoiceId } = args;
      const inv = invoices.find((i: any) =>
        i.id === invoiceId || i.id === `INV-${invoiceId}`
      );
      if (!inv) {
        return { found: false, message: "Invoice not found" };
      }

      const customer = customers.find((c: any) => c.id === inv.courseId);
      return {
        found: true,
        invoice: {
          id: inv.id,
          customer: customer ? customer.name : "Unknown",
          amount: inv.amount,
          status: inv.status,
          date: inv.createdAt,
          paymentUrl: inv.paymentUrl
        }
      };
    } else if (name === 'check_recent_emails') {
      const { maxResults = 10, unreadOnly = false } = args;

      try {
        // Fetch connected accounts
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const accountsRes = await fetch(`${baseUrl}/api/auth/accounts`);

        if (!accountsRes.ok) {
          return { error: "Failed to fetch email accounts" };
        }

        const accounts = await accountsRes.json();
        if (!accounts || accounts.length === 0) {
          return {
            error: "No Gmail accounts connected",
            message: "Please connect a Gmail account in the Emails tab first."
          };
        }

        const accountId = accounts[0].id;
        const query = new URLSearchParams({
          maxResults: Math.min(maxResults, 25).toString()
        });

        const emailsRes = await fetch(`${baseUrl}/api/gmail/${accountId}/messages?${query}`);
        if (!emailsRes.ok) {
          return { error: "Failed to fetch emails from Gmail" };
        }

        const emailData = await emailsRes.json();
        const messages = emailData.messages || [];

        const filteredMessages = unreadOnly
          ? messages.filter((e: any) => !e.isRead)
          : messages;

        return {
          success: true,
          count: filteredMessages.length,
          unreadOnly,
          emails: filteredMessages.map((e: any) => ({
            from: e.from,
            subject: e.subject,
            date: e.date,
            snippet: e.snippet,
            isRead: e.isRead
          }))
        };
      } catch (err: any) {
        return {
          error: "Email check failed",
          message: err.message
        };
      }
    } else if (name === 'search_customer_emails') {
      const { customerName, maxResults = 20 } = args;

      try {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const accountsRes = await fetch(`${baseUrl}/api/auth/accounts`);

        if (!accountsRes.ok) {
          return { error: "Failed to fetch email accounts" };
        }

        const accounts = await accountsRes.json();
        if (!accounts || accounts.length === 0) {
          return {
            error: "No Gmail accounts connected",
            message: "Please connect a Gmail account in the Emails tab first."
          };
        }

        const accountId = accounts[0].id;
        const query = new URLSearchParams({
          maxResults: maxResults.toString(),
          q: customerName
        });

        const emailsRes = await fetch(`${baseUrl}/api/gmail/${accountId}/messages?${query}`);
        if (!emailsRes.ok) {
          return { error: "Failed to search emails" };
        }

        const emailData = await emailsRes.json();
        const messages = emailData.messages || [];

        return {
          success: true,
          customerName,
          count: messages.length,
          emails: messages.map((e: any) => ({
            from: e.from,
            subject: e.subject,
            date: e.date,
            snippet: e.snippet,
            isRead: e.isRead
          }))
        };
      } catch (err: any) {
        return {
          error: "Email search failed",
          message: err.message
        };
      }
    }

    return { error: "Unknown function" };
  } catch (e: any) {
    console.error("Tool execution error", e);
    return { error: e.message };
  }
}

export default router;
