import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;

    // Fetch store context with products, suppliers, and recent transactions
    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      include: {
        products: {
          orderBy: { stock_quantity: "asc" },
          take: 40,
        },
        transactions: {
          take: 20,
          orderBy: { created_at: "desc" },
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!store || !store.products || store.products.length === 0) {
      return NextResponse.json({
        insights: getFallbackInsights([], store?.name || "Retail Store")
      });
    }

    const productsContext = store.products
      .map(p => `- ${p.name} (Category: ${p.category}, Price: KES ${p.selling_price}, Buying Cost: KES ${p.buying_price}, Stock: ${p.stock_quantity}, Reorder level: ${p.reorder_level})`)
      .join("\n");

    const transactionsContext = store.transactions
      .map(t => `- Sold ${t.quantity}x ${t.product?.name || "Product"} for KES ${t.total_price} on ${t.created_at.toLocaleDateString()}`)
      .join("\n") || "No transactions recorded yet.";

    const systemInstruction = `You are Akiba AI, a retail analytics expert for "${store.name}" (Category: ${store.category || "Retail"}).
Based on the products and transaction data below, generate exactly 3 retail insights.
Return ONLY a valid JSON array of exactly 3 objects. Do not wrap the JSON output in markdown blocks like \`\`\`json. Return only the raw JSON.

Each object must follow this strict schema:
{
  "type": "bundle" | "demand" | "slow_moving",
  "title": "Short catchy title (max 6 words)",
  "description": "1-2 sentence detailed suggestion referring to actual products and explaining the action they should take.",
  "badge": "Action Plan/Detail (e.g. 'Estimated Revenue Increase: +12%' or 'Restocking Suggestion: Refill by 4:00 PM' or 'Action Plan: 5% discount')",
  "discussPrompt": "A pre-filled chatbot prompt to help the user talk about this specific insight (e.g. 'How can I bundle Cement with Gloss Paint and what discount should I offer?')"
}

Create:
1. One "bundle" insight: Suggest a product pairing (cross-selling bundle) based on the inventory.
2. One "demand" insight: Alert them about a low stock item needing replenishment, or a sales peak trend.
3. One "slow_moving" insight: Identify an item with high stock relative to its sales and suggest a clearance/marketing strategy.

Actual Products in Store:
${productsContext}

Recent Transactions:
${transactionsContext}`;

    let generatedText = "";

    if (geminiKey) {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: "Generate 3 POS retail insights for my store based on current inventory and sales." }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (e) {
          console.error("Failed to parse Gemini response:", e);
        }
      } else {
        console.error("Gemini Insights request failed status:", response.status);
      }
    } else if (openaiKey) {
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: "Generate 3 POS retail insights for my store based on current inventory and sales." }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          generatedText = data.choices?.[0]?.message?.content || "";
        } catch (e) {
          console.error("Failed to parse OpenAI response:", e);
        }
      }
    }

    if (generatedText.trim()) {
      // Clean markdown wrappers if returned despite instructions
      let cleaned = generatedText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      }
      try {
        const parsed = JSON.parse(cleaned);
        // Ensure it is an array and contains elements
        const insights = Array.isArray(parsed) ? parsed : (parsed.insights || parsed.data || []);
        if (insights.length === 3) {
          return NextResponse.json({ insights });
        }
      } catch (err) {
        console.error("Error parsing generated insights JSON:", err, "Raw text:", generatedText);
      }
    }

    // Fallback if AI fails or keys are missing
    return NextResponse.json({
      insights: getFallbackInsights(store.products, store.name)
    });

  } catch (error: any) {
    console.error("POS Insights Route Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

function getFallbackInsights(products: any[], storeName: string) {
  // If there are no products, return basic general retail insights
  if (products.length === 0) {
    return [
      {
        type: "bundle",
        title: "Create Starter Combo Packs",
        description: "Group similar starter items together at a minor 5% discount to encourage bulk checkouts.",
        badge: "Estimated Revenue Increase: +10%",
        discussPrompt: "How do I create and price starter combo packs for my retail store?"
      },
      {
        type: "demand",
        title: "Monitor Low Stock Closely",
        description: "Your store catalog is currently empty. Add products in the Inventory tab to track restock alerts.",
        badge: "Action Plan: Add Products",
        discussPrompt: "What is the best way to structure my product catalog for inventory tracking?"
      },
      {
        type: "slow_moving",
        title: "Track Sales Patterns Weekly",
        description: "Analyze which items sell fastest to optimize storage and supplier lead times.",
        badge: "Tip: Review reports",
        discussPrompt: "How can I analyze my sales pattern to improve store profitability?"
      }
    ];
  }

  // 1. Bundle Insight: Find two products
  const p1 = products[0];
  const p2 = products[Math.min(1, products.length - 1)];
  const bundleTitle = products.length >= 2
    ? `Bundle "${p1.name}" & "${p2.name}"`
    : `Bundle "${p1.name}" with accessories`;
  const bundleDesc = products.length >= 2
    ? `Combine ${p1.name} and ${p2.name} as a single checkout package. High sales affinity suggests customers buying one often require the other.`
    : `Bundle ${p1.name} with related attachments at a minor 5% discount to increase average order values.`;

  // 2. Demand Insight: Find low stock product
  const lowStockItem = products.find(p => p.stock_quantity <= p.reorder_level) || products[0];
  const demandTitle = `${lowStockItem.name} Restock Needed`;
  const demandDesc = `Stock is currently at ${lowStockItem.stock_quantity} units (Reorder trigger: ${lowStockItem.reorder_level}). Restock soon to prevent missed sales.`;
  const demandBadge = `Restock Alert: Only ${lowStockItem.stock_quantity} left`;

  // 3. Slow Moving Insight: Find high stock product
  const highStockItem = [...products].sort((a, b) => b.stock_quantity - a.stock_quantity)[0];
  const slowTitle = `Slow Moving ${highStockItem.name}`;
  const slowDesc = `You have high stock of ${highStockItem.name} (${highStockItem.stock_quantity} units). Consider a minor weekend discount to release tied-up capital.`;
  const slowBadge = `Action Plan: Offer 5% discount`;

  return [
    {
      type: "bundle",
      title: bundleTitle,
      description: bundleDesc,
      badge: "Estimated Revenue Increase: +15%",
      discussPrompt: `How should I set up a discount bundle for ${p1.name} and ${products.length >= 2 ? p2.name : "related items"}?`
    },
    {
      type: "demand",
      title: demandTitle,
      description: demandDesc,
      badge: demandBadge,
      discussPrompt: `Where can I source more ${lowStockItem.name} quickly and how do I track its supplier details?`
    },
    {
      type: "slow_moving",
      title: slowTitle,
      description: slowDesc,
      badge: slowBadge,
      discussPrompt: `What marketing strategies can I use to clear out slow-moving ${highStockItem.name}?`
    }
  ];
}
