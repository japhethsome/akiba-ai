"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface SearchResult {
  products: Array<{ id: string; name: string; category: string; price: number; path: string }>;
  suppliers: Array<{ id: string; name: string; contact: string; path: string }>;
  pages: Array<{ name: string; path: string }>;
  help: Array<{ name: string; path: string }>;
}

const staticPages = [
  { name: "POS & Sales Register", path: "/dashboard/pos", keywords: ["pos", "sales", "checkout", "sell", "cashier", "mpesa", "cash", "register"] },
  { name: "Inventory Management", path: "/dashboard/inventory", keywords: ["inventory", "stock", "product", "price", "reorder", "quantity", "buying", "selling"] },
  { name: "Suppliers & Restocks", path: "/dashboard/suppliers", keywords: ["supplier", "vendor", "sourcing", "whatsapp", "distributor", "lead time"] },
  { name: "Staff Management", path: "/dashboard/staff", keywords: ["staff", "attendant", "role", "user", "clerk", "employee"] },
  { name: "Settings & Configuration", path: "/dashboard/settings", keywords: ["settings", "payhero", "till", "mpesa", "credentials", "profile", "password"] },
  { name: "Sales Reports & Analytics", path: "/reports", keywords: ["report", "profit", "analytics", "dashboard", "charts", "revenue"] },
  { name: "AI Demand Forecasts", path: "/forecasts", keywords: ["forecast", "ai", "demand", "predict", "analytics", "trend", "recommendation"] }
];

const staticHelp = [
  { name: "How to log transaction in POS", path: "/help-center", keywords: ["pos", "transaction", "sale", "sell", "checkout", "cashier"] },
  { name: "Setting up M-Pesa Till with PayHero", path: "/help-center", keywords: ["mpesa", "till", "payhero", "payment", "checkout", "setup"] },
  { name: "Registering a new Supplier", path: "/help-center", keywords: ["supplier", "register", "vendor", "distributor", "add"] },
  { name: "How to restock via WhatsApp", path: "/help-center", keywords: ["whatsapp", "restock", "order", "purchase", "supplier"] },
  { name: "Understanding AI Safety Reorder Levels", path: "/help-center", keywords: ["ai", "reorder", "level", "safety", "forecast", "prediction"] }
];

export async function searchAllResources(query: string): Promise<{ data?: SearchResult; error?: string }> {
  if (!query || query.trim().length < 2) {
    return { data: { products: [], suppliers: [], pages: [], help: [] } };
  }

  try {
    const session = await getSession();
    if (!session) {
      return { error: "Unauthorized" };
    }

    const storeId = session.storeId;
    const term = query.trim().toLowerCase();

    // Query Products
    const products = await prisma.product.findMany({
      where: {
        store_id: storeId,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { category: { contains: term, mode: "insensitive" } }
        ]
      },
      take: 4
    });

    // Query Suppliers
    const suppliers = await prisma.supplier.findMany({
      where: {
        store_id: storeId,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { contact: { contains: term, mode: "insensitive" } },
          { location: { contains: term, mode: "insensitive" } }
        ]
      },
      take: 4
    });

    // Filter static pages
    const matchingPages = staticPages.filter(
      p => p.name.toLowerCase().includes(term) || p.keywords.some(k => k.includes(term))
    ).map(({ name, path }) => ({ name, path }));

    // Filter static help guides
    const matchingHelp = staticHelp.filter(
      h => h.name.toLowerCase().includes(term) || h.keywords.some(k => k.includes(term))
    ).map(({ name, path }) => ({ name, path }));

    return {
      data: {
        products: products.map(p => ({
          id: p.product_id,
          name: p.name,
          category: p.category,
          price: Number(p.selling_price),
          path: `/dashboard/inventory`
        })),
        suppliers: suppliers.map(s => ({
          id: s.supplier_id,
          name: s.name,
          contact: s.contact,
          path: `/dashboard/suppliers`
        })),
        pages: matchingPages,
        help: matchingHelp
      }
    };
  } catch (err: any) {
    console.error("Search error:", err);
    return { error: err.message || "Something went wrong during search." };
  }
}

export async function getNotifications(): Promise<{ success: boolean; logs?: Array<{ id: string; type: string; content: string; created_at: string }>; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const storeId = session.storeId;
    const logs = await prisma.systemLog.findMany({
      where: { store_id: storeId },
      orderBy: { created_at: "desc" },
      take: 6
    });

    return {
      success: true,
      logs: logs.map(l => ({
        id: l.id,
        type: l.type,
        content: l.content,
        created_at: l.created_at.toISOString()
      }))
    };
  } catch (err: any) {
    console.error("Failed to fetch notifications:", err);
    return { success: false, error: err.message || "Failed to fetch notifications" };
  }
}
