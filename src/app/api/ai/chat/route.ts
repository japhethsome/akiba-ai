import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

// This route acts as a secure proxy to the DeepSeek API
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DeepSeek API key (DEEPSEEK_API_KEY) is missing from environment variables." },
        { status: 500 }
      );
    }

    // Fetch store context to inject into the system prompt
    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      include: { 
        products: { 
          take: 20,
          orderBy: { stock_quantity: "asc" } // Show low-stock items first for relevance
        } 
      }
    });

    const lowStockProducts = store?.products
      .filter(p => p.stock_quantity <= 10)
      .map(p => `${p.name} (${p.stock_quantity} units left)`)
      .join(", ") || "none";

    const systemPrompt = `You are Akiba AI, a smart and friendly inventory management assistant for a Kenyan SME store named "${store?.name || "this store"}" (Category: ${store?.category || "Retail"}).

Context:
- Total products: ${store?.products?.length || 0}
- Low-stock items: ${lowStockProducts}

You help the owner and staff with:
- Inventory analysis and stock-level advice
- Pricing strategies and profit margin tips
- Restock recommendations based on current stock levels
- General business advice for Kenyan SMEs

Keep your responses concise, practical, and relevant to small business operations in Kenya. Use KES (Kenyan Shillings) for currency. Respond in English unless asked to use Kiswahili.`;

    const payload = {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: false,
    };

    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Read the response body regardless of status
    const responseText = await deepseekResponse.text();
    
    if (!deepseekResponse.ok) {
      console.error(`DeepSeek API returned ${deepseekResponse.status}:`, responseText);
      try {
        const errorJson = JSON.parse(responseText);
        const msg = errorJson?.error?.message || `DeepSeek API error (HTTP ${deepseekResponse.status})`;
        
        // Detect insufficient balance specifically
        if (msg.toLowerCase().includes("insufficient balance") || msg.toLowerCase().includes("balance")) {
          return NextResponse.json(
            { error: "Your DeepSeek account has run out of credits. Please top up your balance at platform.deepseek.com to continue using AI features." },
            { status: 402 }
          );
        }
        
        return NextResponse.json({ error: msg }, { status: 502 });
      } catch {
        return NextResponse.json({ error: `DeepSeek API error: HTTP ${deepseekResponse.status}` }, { status: 502 });
      }
    }

    // Parse successful response
    const data = JSON.parse(responseText);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred in the AI route." },
      { status: 500 }
    );
  }
}
