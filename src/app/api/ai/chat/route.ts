import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

// This route acts as a secure proxy supporting both Google Gemini (Free) and OpenAI
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        { error: "No active API key (GEMINI_API_KEY or OPEN_AI_API_KEY) was found in your .env file." },
        { status: 500 }
      );
    }

    // Fetch store context with products, suppliers, and recent transactions to dynamically train/inform the AI
    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      include: { 
        products: { 
          take: 30,
          orderBy: { stock_quantity: "asc" }
        },
        suppliers: {
          take: 10
        },
        transactions: {
          take: 10,
          orderBy: { created_at: "desc" },
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    const lowStockProducts = store?.products
      .filter(p => p.stock_quantity <= p.reorder_level)
      .map(p => `${p.name} (Stock: ${p.stock_quantity}, Reorder level: ${p.reorder_level})`)
      .join(", ") || "none";

    const suppliersList = store?.suppliers
      .map(s => `${s.name} (Contact: ${s.contact}, Location: ${s.location || "N/A"}, Lead time: ${s.lead_time_days} days)`)
      .join("; ") || "none";

    const recentSales = store?.transactions
      .map(t => `${t.quantity}x ${t.product?.name} (Total: KES ${t.total_price}, Type: ${t.transaction_type}, Date: ${t.created_at.toLocaleDateString()})`)
      .join("; ") || "none";

    const systemPrompt = `You are Akiba AI, a smart and friendly business intelligence assistant for a Kenyan SME store named "${store?.name || "this store"}" (Category: ${store?.category || "Retail"}).

Your context consists of real-time database data provided directly by the owner:
- Total products tracked: ${store?.products?.length || 0}
- Items needing restock (at or below reorder level): ${lowStockProducts}
- Active suppliers: ${suppliersList}
- Recent store transactions: ${recentSales}

You help the owner and staff with:
- Analyzing stock levels, identifying which items are low, and suggesting which supplier to contact
- Calculating profit margins, setting optimal selling prices, and designing discount offers
- Reviewing recent sales activity and explaining sales trends
- Answering questions using the exact product, supplier, and transaction names listed in your context.

Keep your responses concise, actionable, and tailored to small business operations in Kenya. Use KES (Kenyan Shillings) for currency. Respond in English unless asked to use Kiswahili.`;

    // 1. Google Gemini integration (Free Tier)
    if (geminiKey) {
      // Filter out the initial assistant greeting to ensure the dialogue begins with user content
      const formattedContents = messages
        .filter((m: any, idx: number) => !(idx === 0 && m.role === "assistant"))
        .map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      const payload = {
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`Gemini API returned ${response.status}:`, responseText);
        try {
          const errJson = JSON.parse(responseText);
          const errMsg = errJson?.error?.message || responseText;
          return NextResponse.json(
            { error: `Gemini API returned an error: ${errMsg}` },
            { status: 502 }
          );
        } catch {
          return NextResponse.json(
            { error: `Gemini API returned an error: ${response.statusText || responseText}` },
            { status: 502 }
          );
        }
      }

      const data = JSON.parse(responseText);
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text received from Gemini.";

      // Map response to standard chat formats so client UI remains untouched
      return NextResponse.json({
        choices: [
          {
            message: {
              content: aiReply
            }
          }
        ]
      });
    }

    // 2. OpenAI fallback
    if (openaiKey) {
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800,
      };

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await openaiResponse.text();
      
      if (!openaiResponse.ok) {
        console.error(`OpenAI API returned ${openaiResponse.status}:`, responseText);
        try {
          const errorJson = JSON.parse(responseText);
          const msg = errorJson?.error?.message || `OpenAI API error (HTTP ${openaiResponse.status})`;
          return NextResponse.json({ error: msg }, { status: 502 });
        } catch {
          return NextResponse.json({ error: `OpenAI API error: HTTP ${openaiResponse.status}` }, { status: 502 });
        }
      }

      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    }

  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred in the AI route." },
      { status: 500 }
    );
  }
}
