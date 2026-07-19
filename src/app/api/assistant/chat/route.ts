import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getSessionUser } from '@/lib/auth/session';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

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

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        reply: 'AI Assistant key is missing. Please configure GEMINI_API_KEY to activate your Business Copilot.',
      });
    }

    // Step 1: Call Gemini to decide if we need a database query
    const classificationResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: DB_SCHEMA_PROMPT },
                { text: `User request: "${queryText}"` }
              ]
            }
          ]
        }),
      }
    );

    if (!classificationResponse.ok) {
      throw new Error('Failed to classify user query with Gemini');
    }

    const classData = await classificationResponse.json();
    const classText = classData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
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
          queryResultsData = await prisma.$queryRawUnsafe(sqlQuery);
        } catch (dbErr: any) {
          console.warn('Prisma raw query failed:', dbErr.message);
          queryResultsData = { error: dbErr.message };
        }
      } else {
        queryResultsData = { error: 'Query rejected: Security check failed. Only SELECT statements are allowed.' };
      }
    }

    // Step 3: Call Gemini again to format the final reply using the queried database results
    const finalAnswerResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are the Business Copilot for PVS POS.
Answer the user's business request professionally and concisely.
If database results are provided, explain them clearly, format stats in bold/tables, and provide smart business advice based on them.
If there are errors or no data, notify the user helpfully.

User request: "${queryText}"
Database query run: "${analysisResult.query || 'None'}"
Database raw response data: ${JSON.stringify(queryResultsData || 'No data fetched')}`
                }
              ]
            }
          ]
        }),
      }
    );

    if (!finalAnswerResponse.ok) {
      throw new Error('Failed to generate final reply with Gemini');
    }

    const finalData = await finalAnswerResponse.json();
    const replyText = finalData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I encountered an issue compiling the response.';

    return NextResponse.json({
      reply: replyText,
      action: analysisResult.action || null,
    });

  } catch (error: any) {
    console.error('POST /api/assistant/chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
