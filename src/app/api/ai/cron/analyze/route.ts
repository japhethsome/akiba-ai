import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import prisma from '@/lib/prisma';

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

export async function GET(req: Request) {
  // 1. Security Check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Process active stores
  const stores = await prisma.store.findMany({ 
    where: { onboarded: true },
    take: 20 
  });

  for (const store of stores) {
    // 3. Fetch low stock snapshot
    const lowStockItems = await prisma.product.findMany({
      where: { 
        store_id: store.id,
        stock_quantity: { lte: 10 } 
      },
      select: { name: true, stock_quantity: true, reorder_level: true, category: true },
    });

    if (lowStockItems.length === 0) continue;

    try {
      // 4. Autonomous AI Analysis
      const { text: analysis } = await generateText({
        model: deepseek('deepseek-chat'),
        system: `You are Akiba AI's autonomous logistics agent. Analyze the inventory snapshot for "${store.name}". 
                 Identify critical stockouts and provide a 3-sentence briefing. 
                 Format: [ENGLISH REPORT] followed by [KISWAHILI REPORT].`,
        prompt: `Inventory Snapshot: ${JSON.stringify(lowStockItems)}`,
      });

      // 5. Store the briefing
      await prisma.systemLog.create({
         data: { 
           store_id: store.id,
           type: 'AI_INVENTORY_REPORT', 
           content: analysis 
         }
      });
    } catch (err) {
      console.error(`Failed AI analysis for store ${store.id}:`, err);
    }
  }

  return new Response('Autonomous analysis complete', { status: 200 });
}
