"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voidTransaction } from "@/lib/actions/transactions";

export interface LedgerTransaction {
  id: string;
  receiptId: string;
  productName: string;
  quantity: number;
  paymentMethod: string;
  totalPrice: number;
  totalProfit: number;
  servedBy: string;
  status: string;
  createdAt: string;
  storeName: string;
}

interface ReceiptGroup {
  receiptId: string;
  storeName: string;
  servedBy: string;
  paymentMethod: string;
  createdAt: string;
  status: string;
  items: LedgerTransaction[];
  total: number;
}

export function TransactionsClient({
  transactions,
  receiptTransactions,
  userRole,
  totals,
}: {
  transactions: LedgerTransaction[];
  receiptTransactions: LedgerTransaction[];
  userRole: string;
  totals: { revenue: number; profit: number; count: number };
}) {
  const router = useRouter();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptGroup | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isOwner = userRole === "owner";

  const receiptGroups = useMemo(() => {
    const groups = new Map<string, ReceiptGroup>();
    for (const transaction of receiptTransactions) {
      const existing = groups.get(transaction.receiptId);
      if (existing) {
        existing.items.push(transaction);
        existing.total += transaction.totalPrice;
      } else {
        groups.set(transaction.receiptId, {
          receiptId: transaction.receiptId,
          storeName: transaction.storeName,
          servedBy: transaction.servedBy,
          paymentMethod: transaction.paymentMethod,
          createdAt: transaction.createdAt,
          status: transaction.status,
          items: [transaction],
          total: transaction.totalPrice,
        });
      }
    }
    return groups;
  }, [receiptTransactions]);

  const exportCsv = () => {
    const headers = [
      "Receipt ID",
      "Date",
      "Product",
      "Qty Sold",
      "Payment Method",
      "Total Price",
      "Total Profit",
      "Served By",
      "Status",
    ];
    const rows = transactions.map((transaction) => [
      transaction.receiptId,
      new Date(transaction.createdAt).toLocaleString("en-KE"),
      transaction.productName,
      transaction.quantity,
      formatPayment(transaction.paymentMethod),
      transaction.totalPrice,
      transaction.totalProfit,
      transaction.servedBy,
      transaction.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `akiba-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleVoid = (transaction: LedgerTransaction) => {
    if (!confirm(`Void ${transaction.productName} from receipt ${transaction.receiptId} and return ${transaction.quantity} units to stock?`)) {
      return;
    }

    setVoidingId(transaction.id);
    startTransition(async () => {
      const result = await voidTransaction(transaction.id);
      setVoidingId(null);
      if (!result.success) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Filtered Sales" value={`KES ${totals.revenue.toLocaleString()}`} icon="payments" />
        {isOwner && <StatCard label="Filtered Profit" value={`KES ${totals.profit.toLocaleString()}`} icon="trending_up" />}
        <StatCard label="Transactions" value={totals.count.toString()} icon="receipt_long" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#171d1a] tracking-tight">Sales Ledger</h2>
          <p className="text-sm font-medium text-[#6d7a73] mt-1">
            {isOwner ? "Owner view includes store-wide totals and confidential profit margins." : "Your view shows only the sales you processed today."}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={exportCsv}
            className="h-12 px-5 rounded-xl bg-[#171d1a] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white border border-[#e4eae4] rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
                <HeaderCell>Receipt</HeaderCell>
                <HeaderCell>Product & Qty</HeaderCell>
                <HeaderCell>Payment</HeaderCell>
                <HeaderCell>Total</HeaderCell>
                {isOwner && <HeaderCell>Profit</HeaderCell>}
                <HeaderCell>Served By</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell align="right">Actions</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 8 : 7} className="p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#f5fbf5] flex items-center justify-center text-[#00694c] mb-4">
                      <span className="material-symbols-outlined text-[32px]">receipt_long</span>
                    </div>
                    <div className="font-black text-[#171d1a]">No transactions found</div>
                    <div className="text-sm font-medium text-[#6d7a73] mt-1">Try adjusting search, payment, or date filters.</div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-[#e4eae4] last:border-0 hover:bg-[#f8faf9] transition-colors">
                    <td className="p-4">
                      <div className="font-black text-[#171d1a]">{transaction.receiptId}</div>
                      <div className="text-[11px] font-bold text-[#6d7a73] mt-1">{new Date(transaction.createdAt).toLocaleString("en-KE")}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-[#171d1a]">{transaction.productName}</div>
                      <div className="text-[11px] font-bold text-[#6d7a73] mt-1">{transaction.quantity} units sold</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest bg-[#f5fbf5] text-[#00694c] border border-[#d9eadf]">
                        {formatPayment(transaction.paymentMethod)}
                      </span>
                    </td>
                    <td className="p-4 font-black text-[#171d1a]">KES {transaction.totalPrice.toLocaleString()}</td>
                    {isOwner && <td className="p-4 font-black text-[#584fbc]">KES {transaction.totalProfit.toLocaleString()}</td>}
                    <td className="p-4 font-bold text-[#171d1a]">{transaction.servedBy}</td>
                    <td className="p-4">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedReceipt(receiptGroups.get(transaction.receiptId) || null)}
                          className="w-10 h-10 rounded-xl border border-[#e4eae4] text-[#6d7a73] hover:text-[#00694c] hover:border-[#00694c] hover:bg-[#f0fdf4] transition-colors"
                          title="Re-print receipt"
                        >
                          <span className="material-symbols-outlined text-[20px]">print</span>
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleVoid(transaction)}
                            disabled={transaction.status === "VOIDED" || (isPending && voidingId === transaction.id)}
                            className="w-10 h-10 rounded-xl border border-[#fecdd3] text-[#e11d48] hover:bg-[#fff1f2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Void / refund transaction"
                          >
                            <span className={`material-symbols-outlined text-[20px] ${isPending && voidingId === transaction.id ? "animate-spin" : ""}`}>
                              {isPending && voidingId === transaction.id ? "refresh" : "undo"}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white border border-[#e4eae4] rounded-[20px] p-5 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] text-[#00694c] flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="text-2xl font-black text-[#171d1a] tracking-tight">{value}</div>
      <div className="text-[10px] font-black text-[#6d7a73] uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function HeaderCell({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73] ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const voided = status === "VOIDED";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border ${
      voided ? "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]" : "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${voided ? "bg-[#e11d48]" : "bg-[#166534]"}`} />
      {voided ? "Voided" : "Complete"}
    </span>
  );
}

function ReceiptModal({ receipt, onClose }: { receipt: ReceiptGroup; onClose: () => void }) {
  const shareText = `Hello, here is your digital receipt for transaction ${receipt.receiptId} at ${receipt.storeName}. Total: KES ${receipt.total.toLocaleString()}.`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-md" aria-label="Close receipt" />
      <div className="bg-white rounded-[28px] p-8 w-full max-w-sm relative z-10 shadow-2xl text-center">
        <div className="w-16 h-16 bg-[#00694c] text-white rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[32px]">receipt_long</span>
        </div>
        <h2 className="text-2xl font-black text-[#171d1a]">Receipt</h2>
        <p className="text-sm font-medium text-[#6d7a73] mt-1 mb-6">{receipt.receiptId}</p>

        <div className="bg-[#f8faf9] border border-[#e4eae4] border-dashed rounded-2xl p-5 text-left mb-6">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-4">
            <span>{receipt.storeName}</span>
            <span>{formatPayment(receipt.paymentMethod)}</span>
          </div>
          <div className="space-y-3 max-h-[180px] overflow-y-auto">
            {receipt.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm font-black text-[#171d1a]">
                <span className="truncate">{item.quantity}x {item.productName}</span>
                <span className="shrink-0">KES {item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e4eae4] border-dashed mt-4 pt-4 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-[#171d1a]">Total Paid</span>
            <span className="text-xl font-black text-[#00694c]">KES {receipt.total.toLocaleString()}</span>
          </div>
          <div className="text-[11px] font-bold text-[#6d7a73] mt-4">Served by {receipt.servedBy} on {new Date(receipt.createdAt).toLocaleString("en-KE")}</div>
        </div>

        <div className="space-y-3">
          <button onClick={() => window.print()} className="w-full h-14 bg-[#171d1a] hover:bg-black text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[20px]">print</span>
            Print Receipt
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full h-14 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#00694c] rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            Share via WhatsApp
          </a>
          <button onClick={onClose} className="w-full h-14 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#171d1a] rounded-xl font-black text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPayment(paymentMethod: string) {
  return paymentMethod === "MPESA" ? "M-Pesa" : "Cash";
}
