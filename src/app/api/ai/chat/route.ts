import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Limits each user to 20 AI chat requests per 60 minutes.
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    // New window
    rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// ─── GET — Load conversation history from Insight table ──────────────────────
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json({ messages: [] });
    }

    // Load the last 20 insight records (10 user/AI pairs) from the DB
    const savedInsights = await prisma.insight.findMany({
      where: { store_id: store.id },
      orderBy: { created_at: "asc" },
      take: 20,
    });

    // Convert DB records back to message pairs
    const messages: { role: "user" | "assistant"; content: string; savedAt?: string }[] = [];
    for (const insight of savedInsights) {
      messages.push({ role: "user", content: insight.query });
      messages.push({ role: "assistant", content: insight.response, savedAt: insight.created_at.toISOString() });
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("AI Chat GET Error:", error);
    return NextResponse.json({ messages: [] });
  }
}

// ─── DELETE — Clear conversation history ─────────────────────────────────────
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      select: { id: true },
    });

    if (store) {
      await prisma.insight.deleteMany({ where: { store_id: store.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("AI Chat DELETE Error:", error);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}

// ─── Local Offline/Fallback Chatbot Response Generator ──────────────────────
function getLocalFallbackResponse(query: string, store: any, todaySalesCount: number, todayRevenue: number): string {
  const q = query.toLowerCase().trim();

  // 1. Low stock / Restock alerts
  if (q.includes("low stock") || q.includes("restock") || q.includes("shortage") || q.includes("reorder") || q.includes("alert")) {
    const lowStockProducts = store?.products.filter((p: any) => p.stock_quantity <= p.reorder_level) || [];
    if (lowStockProducts.length === 0) {
      return "Excellent news! All items in your inventory are currently well-stocked (above reorder levels). No restocking is needed at the moment.";
    }
    const list = lowStockProducts.map((p: any) => 
      `• **${p.name}** — ${p.stock_quantity} left (min: ${p.reorder_level})${p.supplier ? `, Supplier: ${p.supplier.name} (${p.supplier.whatsapp_number || p.supplier.contact})` : ", Unassigned"}`
    ).join("\n");
    return `🚨 **Low Stock Alerts:**\n\nThe following ${lowStockProducts.length} item(s) are at or below critical reorder levels:\n\n${list}\n\nWould you like me to draft a purchase order to any of these suppliers?`;
  }

  // 2. Suppliers list and contacts
  if (q.includes("supplier") || q.includes("vendor") || q.includes("contact") || q.includes("whatsapp") || q.includes("phone")) {
    const suppliers = store?.suppliers || [];
    if (suppliers.length === 0) {
      return "You don't have any suppliers saved in the system yet. You can add them in the **Suppliers** tab of the dashboard.";
    }
    const list = suppliers.map((s: any) => 
      `• **${s.name}**${s.company_name ? ` (${s.company_name})` : ""} — Phone: ${s.contact}${s.whatsapp_number ? `, WhatsApp: ${s.whatsapp_number}` : ""}, Lead time: ${s.lead_time_days} days`
    ).join("\n");
    return `🤝 **Registered Suppliers:**\n\nHere are your store's vendors:\n\n${list}`;
  }

  // 3. Sales / Revenue / Performance
  if (q.includes("sale") || q.includes("revenue") || q.includes("today") || q.includes("performance") || q.includes("transaction")) {
    const recent = store?.transactions.slice(0, 5).map((t: any) => 
      `• ${t.quantity}x **${t.product?.name || "Product"}** — KES ${Number(t.total_price).toLocaleString()} (${t.transaction_type.replace("SALE_", "")})`
    ).join("\n") || "No transactions recorded.";
    return `📊 **Today's Performance & Recent Sales:**\n\n• **Sales Transactions Today:** ${todaySalesCount}\n• **Total Revenue Today:** KES ${todayRevenue.toLocaleString()}\n\n**Last 5 Transactions:**\n${recent}`;
  }

  // 4. Products / Prices / Margins
  if (q.includes("product") || q.includes("price") || q.includes("margin") || q.includes("cost") || q.includes("inventory")) {
    const products = store?.products.slice(0, 10) || [];
    if (products.length === 0) {
      return "Your inventory is currently empty. You can add products in the **Inventory** page.";
    }
    const list = products.map((p: any) => {
      const margin = p.selling_price > 0 ? Math.round(((Number(p.selling_price) - Number(p.buying_price)) / Number(p.selling_price)) * 100) : 0;
      return `• **${p.name}**: Selling KES ${Number(p.selling_price).toLocaleString()} | Cost KES ${Number(p.buying_price).toLocaleString()} (Margin: **${margin}%**) | Stock: ${p.stock_quantity}`;
    }).join("\n");
    const countNote = store?.products.length > 10 ? `\n\n*(Showing top 10 of ${store.products.length} products)*` : "";
    return `📦 **Product Catalog & Margins:**\n\nHere is a list of your products and price details:\n\n${list}${countNote}`;
  }

  // 5. PO / Draft message
  if (q.includes("draft") || q.includes("message") || q.includes("order")) {
    const lowStockProducts = store?.products.filter((p: any) => p.stock_quantity <= p.reorder_level) || [];
    if (lowStockProducts.length === 0) {
      return "No items currently need restocking, but here is a general order template you can use:\n\n```\nHabari [Supplier Name], please supply the following items:\n- [Item Name] x[Qty]\n\nShukran!\n```";
    }
    // Draft for the first supplier
    const firstLow = lowStockProducts[0];
    const supplierName = firstLow.supplier?.name || "[Supplier Name]";
    const restockQty = Math.max(firstLow.reorder_level * 2 - firstLow.stock_quantity, firstLow.reorder_level);
    const draftMsg = `*RESTOCK ORDER — ${store?.name || "Store"}*\nDate: ${new Date().toLocaleDateString("en-KE")}\n\nHabari ${supplierName},\n\nPlease supply the following items:\n• *${firstLow.name}* x${restockQty} units\n\nPlease confirm delivery date. Shukran!`;
    return `📝 **Draft Purchase Order Message:**\n\nHere is a draft reorder template for **${supplierName}** based on low stock:\n\n---\n${draftMsg}\n---`;
  }

  // 6. Help / Greeting / Fallback default
  return `Jambo! I am **Akiba AI**, your smart retail assistant.\n\nI am currently running in **offline backup mode** because the Gemini API connection is busy or unavailable. However, I still have direct access to your local store records!\n\nYou can ask me about:\n1. 🚨 **Low stock alerts** (e.g. *"what is low in stock?"*)\n2. 🤝 **Supplier contacts** (e.g. *"list my suppliers"*)\n3. 📊 **Today's sales** (e.g. *"how much did we sell today?"*)\n4. 📦 **Product details & margins** (e.g. *"show my inventory margins"*)\n5. 📝 **Drafting orders** (e.g. *"draft a reorder message"*)\n\nWhat would you like to check?`;
}

// ─── POST — Main AI chat handler ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const { allowed, remaining } = checkRateLimit(session.userId);
    let offlineReason = "";
    if (!allowed) {
      offlineReason = "You have reached the AI limit of 20 messages/hour. Switched to offline backup mode.";
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey && !offlineReason) {
      offlineReason = "No GEMINI_API_KEY found in your .env file. Switched to offline backup mode.";
    }

    const body = await req.json();
    const { messages } = body;

    // Last user message is what we want to save
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";

    // ─── Rich store context from DB ───────────────────────────────────────
    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      include: {
        products: {
          orderBy: { stock_quantity: "asc" },
          include: { supplier: { select: { name: true, contact: true, whatsapp_number: true } } },
        },
        suppliers: true,
        transactions: {
          take: 20,
          orderBy: { created_at: "desc" },
          include: {
            product: { select: { name: true } },
            user: { select: { name: true } },
          },
        },
      },
    });

    // Revenue stats today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTransactions = store?.transactions.filter(t => new Date(t.created_at) >= todayStart) || [];
    const todayRevenue = todayTransactions.reduce((s, t) => s + Number(t.total_price), 0);
    const todaySalesCount = todayTransactions.length;

    // ─── Handle Offline Mode ───────────────────────────────────────────────
    if (offlineReason) {
      const fallbackText = getLocalFallbackResponse(lastUserMessage, store, todaySalesCount, todayRevenue) + 
        `\n\n*(Note: ${offlineReason})*`;

      if (store && lastUserMessage && fallbackText) {
        await prisma.insight.create({
          data: {
            store_id: store.id,
            query: lastUserMessage,
            response: fallbackText,
          },
        });
      }

      return NextResponse.json({
        choices: [
          {
            message: {
              content: fallbackText,
            },
          },
        ],
        rateLimitRemaining: remaining,
      });
    }

    // Build rich product list
    const allProducts = store?.products
      .map(p =>
        `• ${p.name} | Category: ${p.category} | Sell: KES ${p.selling_price} | Buy: KES ${p.buying_price} | Stock: ${p.stock_quantity} | Min Stock: ${p.reorder_level}${p.supplier ? ` | Supplier: ${p.supplier.name} (${p.supplier.contact})` : " | Supplier: Unassigned"}`
      )
      .join("\n") || "No products in inventory.";

    const lowStockList = store?.products
      .filter(p => p.stock_quantity <= p.reorder_level)
      .map(p => `• ${p.name} — ${p.stock_quantity} left (min: ${p.reorder_level})${p.supplier ? `, Supplier: ${p.supplier.name} (WA: ${p.supplier.whatsapp_number || p.supplier.contact})` : ""}`)
      .join("\n") || "All items are well-stocked.";

    const allSuppliers = store?.suppliers
      .map(s => `• ${s.name}${s.company_name ? ` (${s.company_name})` : ""} — Phone: ${s.contact}${s.whatsapp_number ? `, WhatsApp: ${s.whatsapp_number}` : ""}, Lead time: ${s.lead_time_days} days${s.payment_terms ? `, Payment: ${s.payment_terms}` : ""}${s.location ? `, Location: ${s.location}` : ""}`)
      .join("\n") || "No suppliers on file.";

    const recentSales = store?.transactions
      .map(t =>
        `• ${t.quantity}x ${t.product?.name} — KES ${t.total_price} (${t.transaction_type.replace("SALE_", "")}) by ${t.user?.name || "Staff"} on ${t.created_at.toLocaleDateString("en-KE")}`
      )
      .join("\n") || "No transactions yet.";

    const systemPrompt = `You are Akiba AI, a smart business intelligence assistant for a Kenyan SME retail store named "${store?.name || "this store"}" (Category: ${store?.category || "Retail"}).

You have access to the store's LIVE database data right now:

📦 FULL INVENTORY (${store?.products?.length || 0} products):
${allProducts}

🚨 LOW STOCK ALERTS:
${lowStockList}

🤝 SUPPLIERS (${store?.suppliers?.length || 0} on file):
${allSuppliers}

💳 RECENT TRANSACTIONS (last 20):
${recentSales}

📊 TODAY'S PERFORMANCE:
• Sales transactions today: ${todaySalesCount}
• Revenue today: KES ${todayRevenue.toLocaleString()}

You help the owner and staff with:
- Identifying which items are critically low and which supplier to contact (with their phone/WhatsApp)
- Calculating profit margins, optimizing prices, and designing discount bundles
- Reviewing sales trends and advising on restocking priorities
- Drafting professional WhatsApp reorder messages to suppliers
- Any business strategy question tailored to Kenyan SME context

Keep responses concise, actionable, and structured. Use bullet points, bold text for key numbers, and headings for long answers. Always use KES for currency. If asked to draft a reorder message, use formal but friendly Kenyan business language.`;

    // ─── Call Gemini API ───────────────────────────────────────────────────
    const formattedContents = messages
      .filter((m: any, idx: number) => !(idx === 0 && m.role === "assistant"))
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const payload = {
      contents: formattedContents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Gemini API returned ${response.status}:`, responseText);
      // Fallback to offline mode instead of failing
      const fallbackText = getLocalFallbackResponse(lastUserMessage, store, todaySalesCount, todayRevenue) + 
        `\n\n*(Note: Gemini API returned status ${response.status}. Switched to offline backup mode.)*`;

      if (store && lastUserMessage && fallbackText) {
        await prisma.insight.create({
          data: {
            store_id: store.id,
            query: lastUserMessage,
            response: fallbackText,
          },
        });
      }

      return NextResponse.json({
        choices: [
          {
            message: {
              content: fallbackText,
            },
          },
        ],
        rateLimitRemaining: remaining,
      });
    }

    const data = JSON.parse(responseText);
    const aiReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received from Gemini. Please try again.";

    // ─── Persist this exchange to the Insight table ────────────────────────
    if (store && lastUserMessage && aiReply) {
      await prisma.insight.create({
        data: {
          store_id: store.id,
          query: lastUserMessage,
          response: aiReply,
        },
      });
    }

    return NextResponse.json({
      choices: [
        {
          message: {
            content: aiReply,
          },
        },
      ],
      rateLimitRemaining: remaining,
    });
  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    // Return friendly local fallback response even on unhandled network/internal catch
    try {
      const session = await getSession();
      const store = await prisma.store.findFirst({
        where: { users: { some: { user_id: session?.userId } } },
        include: {
          products: {
            orderBy: { stock_quantity: "asc" },
            include: { supplier: { select: { name: true, contact: true, whatsapp_number: true } } },
          },
          suppliers: true,
          transactions: {
            take: 20,
            orderBy: { created_at: "desc" },
            include: {
              product: { select: { name: true } },
              user: { select: { name: true } },
            },
          },
        },
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTransactions = store?.transactions.filter(t => new Date(t.created_at) >= todayStart) || [];
      const todayRevenue = todayTransactions.reduce((s, t) => s + Number(t.total_price), 0);
      const todaySalesCount = todayTransactions.length;

      const body = await req.json().catch(() => ({ messages: [] }));
      const lastUserMessage = [...body.messages].reverse().find((m: any) => m.role === "user")?.content || "";

      const fallbackText = getLocalFallbackResponse(lastUserMessage, store, todaySalesCount, todayRevenue) + 
        `\n\n*(Note: Switched to offline backup mode due to internal error: ${error.message || "Unknown Error"})*`;

      return NextResponse.json({
        choices: [
          {
            message: {
              content: fallbackText,
            },
          },
        ],
        rateLimitRemaining: 0,
      });
    } catch {
      return NextResponse.json(
        { error: "An unexpected error occurred. Please refresh and try again." },
        { status: 500 }
      );
    }
  }
}
