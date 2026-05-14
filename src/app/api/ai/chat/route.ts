import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.storeId) return new Response('Unauthorized', { status: 401 });

  const { messages } = await req.json();

  const result = await streamText({
    model: deepseek('deepseek-chat'),
    system: SYSTEM_PROMPT + `\n\nYou are currently managing the store with ID: ${session.storeId}. ONLY query data for this specific store.`,
    messages,
    maxSteps: 5,
    tools: {
      check_inventory: tool({
        description: 'Search for current stock levels of products by name, category, or find low stock items.',
        parameters: z.object({
          searchTerm: z.string().optional().describe('Product name or category to search for. Leave empty to find low-stock items.'),
        }),
        execute: async ({ searchTerm }) => {
          const products = await prisma.product.findMany({
            where: {
              store_id: session.storeId,
              AND: [
                searchTerm ? {
                  OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { category: { contains: searchTerm, mode: 'insensitive' } },
                  ]
                } : {
                  stock_quantity: { lte: 10 } // Simplified low stock check
                }
              ]
            },
            select: { product_id: true, name: true, stock_quantity: true, reorder_level: true, unit_price: true, category: true },
            take: 10,
          });
          return products;
        },
      }),

      flag_for_reorder: tool({
        description: 'Flag an item for immediate reorder if stock is critically low.',
        parameters: z.object({
          productId: z.string(),
          recommendedQuantity: z.number(),
          urgency: z.enum(['NORMAL', 'HIGH', 'CRITICAL']),
        }),
        execute: async ({ productId, recommendedQuantity, urgency }) => {
          const alert = await prisma.restockAlert.create({
            data: {
              store_id: session.storeId,
              product_id: productId,
              recommended_quantity: recommendedQuantity,
              urgency,
              status: 'PENDING_APPROVAL', 
            },
          });
          return { success: true, alertId: alert.id, message: `Alert created with ${urgency} priority.` };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
