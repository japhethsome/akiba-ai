import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { TransactionsClient, type LedgerTransaction } from "./TransactionsClient";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type LedgerRow = Prisma.TransactionGetPayload<{
  include: {
    product: { select: { name: true } };
    user: { select: { name: true } };
    store: { select: { name: true } };
  };
}>;

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user) redirect("/auth");

  const params = await searchParams;
  const query = getParam(params.q);
  const payment = getParam(params.payment);
  const range = getParam(params.range) || "today";
  const from = getParam(params.from);
  const to = getParam(params.to);
  const isOwner = user.role === "owner";
  const dateFilter = buildDateFilter(range, from, to);

  const where: Prisma.TransactionWhereInput = {
    store_id: user.store_id,
    ...(dateFilter ? { created_at: dateFilter } : {}),
    ...(payment === "CASH" || payment === "MPESA" ? { payment_method: payment } : {}),
    ...(!isOwner
      ? {
          user_id: user.user_id,
          status: { not: "VOIDED" },
          created_at: dateFilter || { gte: startOfToday() },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { receipt_id: { contains: query, mode: "insensitive" } },
            { product: { name: { contains: query, mode: "insensitive" } } },
            { user: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      product: { select: { name: true } },
      user: { select: { name: true } },
      store: { select: { name: true } },
    },
    orderBy: { created_at: "desc" },
    take: 300,
  });

  const receiptIds = Array.from(
    new Set(transactions.map((transaction: LedgerRow) => transaction.receipt_id).filter((receiptId): receiptId is string => Boolean(receiptId)))
  );
  const receiptRows =
    receiptIds.length > 0
      ? await prisma.transaction.findMany({
          where: {
            store_id: user.store_id,
            receipt_id: { in: receiptIds },
            ...(!isOwner ? { user_id: user.user_id, status: { not: "VOIDED" } } : {}),
          },
          include: {
            product: { select: { name: true } },
            user: { select: { name: true } },
            store: { select: { name: true } },
          },
          orderBy: { created_at: "asc" },
        })
      : [];

  const plainTransactions: LedgerTransaction[] = transactions.map((transaction: LedgerRow) => ({
    id: transaction.transaction_id,
    receiptId: transaction.receipt_id || transaction.transaction_id,
    productName: transaction.product.name,
    quantity: transaction.quantity,
    paymentMethod: transaction.payment_method,
    totalPrice: Number(transaction.total_price),
    totalProfit: Number(transaction.total_profit),
    servedBy: transaction.user.name,
    status: transaction.status,
    createdAt: transaction.created_at.toISOString(),
    storeName: transaction.store.name,
  }));
  const receiptTransactions: LedgerTransaction[] = [...receiptRows, ...transactions.filter((transaction: LedgerRow) => !transaction.receipt_id)].map(
    (transaction: LedgerRow) => ({
      id: transaction.transaction_id,
      receiptId: transaction.receipt_id || transaction.transaction_id,
      productName: transaction.product.name,
      quantity: transaction.quantity,
      paymentMethod: transaction.payment_method,
      totalPrice: Number(transaction.total_price),
      totalProfit: Number(transaction.total_profit),
      servedBy: transaction.user.name,
      status: transaction.status,
      createdAt: transaction.created_at.toISOString(),
      storeName: transaction.store.name,
    })
  );

  const completedTransactions = plainTransactions.filter((transaction) => transaction.status !== "VOIDED");
  const totals = {
    revenue: completedTransactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0),
    profit: completedTransactions.reduce((sum, transaction) => sum + transaction.totalProfit, 0),
    count: plainTransactions.length,
  };

  return (
    <DashboardLayoutWrapper>
      <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9eadf] bg-[#f0fdf4] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#00694c] mb-4">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              {isOwner ? "Owner Ledger" : "Clerk Shift Ledger"}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#171d1a]">Transactions</h1>
            <p className="text-[#6d7a73] font-medium mt-2 max-w-2xl">
              Track payments, reprint receipts, share digital receipts, and keep stock accurate when a sale needs to be voided.
            </p>
          </div>

          <form className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_130px] gap-3 bg-white border border-[#e4eae4] rounded-[24px] p-4 shadow-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bccac1]">search</span>
              <input
                name="q"
                defaultValue={query}
                placeholder="Search product, clerk, or receipt ID"
                className="w-full h-12 pl-12 pr-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 transition-all"
              />
            </div>
            <select
              name="payment"
              defaultValue={payment}
              className="h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-black text-[#171d1a] outline-none focus:border-[#00694c]"
            >
              <option value="">All Payments</option>
              <option value="MPESA">M-Pesa</option>
              <option value="CASH">Cash</option>
            </select>
            <select
              name="range"
              defaultValue={range}
              className="h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-black text-[#171d1a] outline-none focus:border-[#00694c]"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
            <button className="h-12 rounded-xl bg-[#00694c] text-white font-black text-xs uppercase tracking-widest hover:bg-[#00553e] transition-colors">
              Filter
            </button>
          </form>
        </div>

        <TransactionsClient transactions={plainTransactions} receiptTransactions={receiptTransactions} userRole={user.role} totals={totals} />
      </main>
    </DashboardLayoutWrapper>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildDateFilter(range: string, from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (from || to) {
    return {
      ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    };
  }

  const now = new Date();
  const today = startOfToday();

  if (range === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const end = new Date(today);
    end.setMilliseconds(-1);
    return { gte: yesterday, lte: end };
  }

  if (range === "last7") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { gte: start };
  }

  if (range === "all") return undefined;

  return { gte: today };
}
