import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getSessionUser } from '@/lib/auth/session';

import { routerService } from '@/lib/ai/router';

// Minimal schema summary for Gemini context
const DB_SCHEMA_PROMPT = `
You are the AI Business Pilot for PVS POS, a retail supermarket management system.
You can query the database using standard PostgreSQL SELECT queries.
Here is the database schema:

1. table "profiles" (users/employees):
   - "id" (uuid)
   - "full_name" (text)
   - "email" (text)
   - "role" ('OWNER', 'MANAGER', 'CASHIER')
   - "store_name" (text)
   - "store_address" (text)
   - "phone" (text)
   - "gst_number" (text)
   - "currency" (text)
   - "tax_rate" (numeric)
   - "is_active" (boolean)
   - "created_at" (timestamp)

2. table "categories":
   - "id" (text, CUID)
   - "name" (text)
   - "slug" (text)
   - "is_active" (boolean)

3. table "products":
   - "id" (text, CUID)
   - "name" (text)
   - "sku" (text)
   - "barcode" (text)
   - "category_id" (text, links to categories.id)
   - "price" (numeric)
   - "cost_price" (numeric)
   - "tax_rate" (numeric)
   - "unit" ('PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'DOZEN', 'BOX', 'PACK')
   - "is_active" (boolean)
   - "low_stock_threshold" (integer)

4. table "inventories" (stock level per product):
   - "id" (text, CUID)
   - "product_id" (text, links to products.id)
   - "quantity" (integer)
   - "reorder_point" (integer)

5. table "sales" (checkout invoices):
   - "id" (text, CUID)
   - "invoice_number" (text)
   - "subtotal" (numeric)
   - "tax_amount" (numeric)
   - "discount_amount" (numeric)
   - "total" (numeric)
   - "payment_method" ('CASH', 'UPI')
   - "payment_status" ('COMPLETED', 'PENDING', 'FAILED')
   - "created_by" (uuid, links to profiles.id)
   - "created_at" (timestamp)

6. table "sale_items" (items inside each sale):
   - "id" (text, CUID)
   - "sale_id" (text, links to sales.id)
   - "product_id" (text, links to products.id)
   - "product_name" (text)
   - "quantity" (integer)
   - "unit_price" (numeric)
   - "tax_rate" (numeric)
   - "tax_amount" (numeric)
   - "discount" (numeric)
   - "total" (numeric)

Your task:
Analyze the user's message and determine if answering it requires querying the database.
If yes, write a clean, optimized PostgreSQL SELECT query.
If the query is comparing dates, use CURRENT_DATE or date functions. For example:
- Today's sales: "created_at >= CURRENT_DATE" or "created_at >= NOW() - INTERVAL '1 day'"
- Sales this week: "created_at >= NOW() - INTERVAL '7 days'"
- Profits: "SUM((unit_price - COALESCE(p.cost_price, 0)) * si.quantity) FROM sale_items si JOIN products p ON si.product_id = p.id"

Respond ONLY with a JSON object of this structure:
{
  "needsQuery": true/false,
  "query": "SQL SELECT query or empty string",
  "explanation": "What query does",
  "action": {
    "type": "NAVIGATE", // optional: NAVIGATE, null
    "payload": "/billing" // optional path: /billing, /products, /inventory, /sales, /users, /settings
  }
}
Do not format the JSON in markdown code blocks. Keep it raw JSON.
`;

// Helper to recursively convert BigInt fields to numbers/strings so JSON.stringify doesn't crash
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key in obj) {
      res[key] = serializeBigInt(obj[key]);
    }
    return res;
  }
  return obj;
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();
    const queryText = (message || '').trim();

    if (!queryText) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Step 1: Call Multi-model Router to decide if we need a database query
    let classText = '{}';
    try {
      const classResponse = await routerService.generate({
        systemPrompt: DB_SCHEMA_PROMPT,
        prompt: `User request: "${queryText}"`
      });
      classText = classResponse.text || '{}';
    } catch (err: any) {
      console.warn('[AI-Router] Classification step failed, falling back to basic layout:', err.message);
    }

    const cleanedClassJson = classText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let analysisResult: {
      needsQuery: boolean;
      query: string;
      explanation: string;
      action?: { type: string; payload: string };
    };

    try {
      analysisResult = JSON.parse(cleanedClassJson);
    } catch {
      analysisResult = { needsQuery: false, query: '', explanation: '' };
    }

    let queryResultsData = null;

    // Step 2: If query is needed, execute the SQL read-only SELECT query
    if (analysisResult.needsQuery && analysisResult.query) {
      const sqlQuery = analysisResult.query.trim();
      
      // Strict Security Check: Verify it is a SELECT query and does not contain mutating commands
      const lowerQuery = sqlQuery.toLowerCase();
      const isReadOnly = lowerQuery.startsWith('select') || lowerQuery.startsWith('with');
      const hasMutators = lowerQuery.includes('delete') || 
                           lowerQuery.includes('update') || 
                           lowerQuery.includes('insert') || 
                           lowerQuery.includes('drop') || 
                           lowerQuery.includes('truncate') || 
                           lowerQuery.includes('alter') || 
                           lowerQuery.includes('grant');

      if (isReadOnly && !hasMutators) {
        try {
          // Execute raw SQL securely
          const rawData = await prisma.$queryRawUnsafe(sqlQuery);
          queryResultsData = serializeBigInt(rawData);
        } catch (dbErr: any) {
          console.warn('Prisma raw query failed:', dbErr.message);
          queryResultsData = { error: dbErr.message };
        }
      } else {
        queryResultsData = { error: 'Query rejected: Security check failed. Only SELECT statements are allowed.' };
      }
    }

    // Step 3: Call Multi-model Router again to format the final reply
    const finalPrompt = `You are the PVS POS Enterprise AI Store Manager. Your task is to compile a structured, visual response for the user's request.
We want to present high-value business insights using structured layouts (KPI cards, tables, charts, timeline, recommendations, and next-action suggestions).

Based on the user's request and the database results (if any), compile a JSON response matching the following schema.
Do not wrap it in markdown code blocks. Return ONLY the raw JSON string.

Schema:
{
  "reply": "Friendly, professional, human-like summary explanation of the results. Address the user directly. Never answer with dry lists; synthesize the information as a real store manager would. Notice low inventory, point out trends, and suggest actions.",
  "action": {
    "type": "NAVIGATE", // optional
    "payload": "/inventory" // optional path to redirect to: "/billing", "/products", "/inventory", "/sales", "/settings"
  },
  "layout": {
    "type": "EXECUTIVE_SUMMARY" | "TABLE" | "CHART" | "TIMELINE" | "ALERTS" | "RECOMMENDATIONS" | "NONE",
    
    // Fill this ONLY if type is "EXECUTIVE_SUMMARY"
    "kpis": [
      { "label": "Revenue", "value": "₹4,250", "change": "+8%", "trend": "up" } // trend can be "up", "down", "neutral"
    ],
    
    // Fill this ONLY if type is "TABLE"
    "table": {
      "headers": ["Product Name", "SKU", "Stock", "Status"],
      "rows": [
        { "Product Name": "Colgate Toothpaste", "SKU": "PVS-GROC-00001", "Stock": 2, "Status": "Low Stock" }
      ]
    },
    
    // Fill this ONLY if type is "CHART"
    "chart": {
      "type": "BAR", // can be "BAR", "LINE", "PIE", "AREA"
      "title": "Weekly Sales Trend",
      "data": [
        { "name": "Mon", "value": 1500 },
        { "name": "Tue", "value": 2400 }
      ]
    },
    
    // Fill this ONLY if type is "TIMELINE"
    "timeline": [
      { "title": "Activity Title", "time": "2 hours ago", "description": "Sold 5 items", "status": "success" } // status can be "success", "warning", "info"
    ],
    
    // Fill this ONLY if type is "ALERTS"
    "alerts": [
      { "type": "WARNING", "message": "Alert message text" } // type can be "CRITICAL", "WARNING", "SUCCESS", "INFO"
    ],
    
    // Fill this ONLY if type is "RECOMMENDATIONS"
    "recommendations": [
      { "text": "Recommendation item", "checked": false }
    ]
  },
  
  // Provide 2-3 smart contextual follow-up suggestions/questions the user can click next
  "suggestions": [
    { "label": "Check Low Stock", "command": "Show low stock products" }
  ]
}

Guidance for layout selection:
- If the database response has list data (like a list of products, invoices, or transactions), use "TABLE". Limit the number of rows to 10 for best visual layout. Include columns that are relevant and format currency values as ₹.
- If the user asks for financial performance, sales counts, or general store health, use "EXECUTIVE_SUMMARY" to show key indicators.
- If the user asks for trends over time, sales by category, or relative comparisons, use "CHART".
- If the user is asking about stock alerts or critical problems, use "ALERTS".
- If the user asks for recommendations, analysis, or what to do next, use "RECOMMENDATIONS".
- Otherwise, use "NONE".

Input data to build response from:
User Request: "${queryText}"
Database query run: "${analysisResult.query || 'None'}"
Database raw response data: ${JSON.stringify(queryResultsData || 'No data fetched')}`;

    const finalAnswerResponse = await routerService.generate({
      prompt: finalPrompt
    });

    const replyText = finalAnswerResponse.text || '{}';
    const cleanedReplyJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedReplyJson);
    } catch {
      parsedResponse = {
        reply: replyText,
        layout: { type: 'NONE' },
        suggestions: [
          { label: 'Check Low Stock', command: 'Show low stock products' },
          { label: 'Show Sales Summary', command: 'Show store performance summary' }
        ]
      };
    }

    return NextResponse.json({
      reply: parsedResponse.reply || cleanedReplyJson,
      layout: parsedResponse.layout || null,
      suggestions: parsedResponse.suggestions || null,
      action: parsedResponse.action || analysisResult.action || null,
    });

  } catch (error: any) {
    console.error('POST /api/assistant/chat error:', error);
    // Standard system failure prompt (never expose raw rate-limit / API errors)
    return NextResponse.json({ 
      reply: "I'm temporarily having trouble reaching the AI service. Please try again in a few moments.",
      layout: { type: 'NONE' },
      suggestions: [
        { label: 'Check Low Stock', command: 'Show low stock products' },
        { label: 'Show Sales Summary', command: 'Show store performance summary' }
      ]
    });
  }
}
