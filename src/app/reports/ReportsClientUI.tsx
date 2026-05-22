"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyPLReport, getTaxComplianceReport, sendReportEmail } from "@/lib/actions/reports";

interface ReportsClientUIProps {
  initialSettings: {
    userName: string;
    userEmail: string;
    userPhone: string;
    userRole: string;
    storeName: string;
    storeCategory: string | null;
    kraPin?: string | null;
    storeAddress?: string | null;
    etimsSerial?: string | null;
    storePhone?: string | null;
    storeEmail?: string | null;
    taxComplianceEnabled?: boolean | null;
  };
}

export function ReportsClientUI({ initialSettings }: ReportsClientUIProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"pl" | "tax">("pl");

  // Date Pickers (Local time defaults)
  const getTodayString = () => {
    const today = new Date();
    return today.toLocaleDateString("en-CA"); // YYYY-MM-DD
  };

  const getFirstOfMonthString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const [plDate, setPlDate] = useState(getTodayString());
  const [plData, setPlData] = useState<any>(null);
  const [plLoading, setPlLoading] = useState(true);
  const [plError, setPlError] = useState<string | null>(null);

  const [taxStartDate, setTaxStartDate] = useState(getFirstOfMonthString());
  const [taxEndDate, setTaxEndDate] = useState(getTodayString());
  const [taxData, setTaxData] = useState<any>(null);
  const [taxLoading, setTaxLoading] = useState(true);
  const [taxError, setTaxError] = useState<string | null>(null);

  // Email Sharing States
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState(initialSettings.userEmail || "");
  const [emailTarget, setEmailTarget] = useState<"pl" | "tax">("pl");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showMailtoFallback, setShowMailtoFallback] = useState(false);

  // Load P&L
  const loadPL = async (date: string) => {
    setPlLoading(true);
    setPlError(null);
    try {
      const res = await getDailyPLReport(date);
      if (res.success) {
        setPlData(res.data);
      } else {
        setPlError(res.error || "Failed to load Daily P&L report.");
      }
    } catch (e: any) {
      setPlError(e.message || "An unexpected error occurred.");
    } finally {
      setPlLoading(false);
    }
  };

  // Load Tax
  const loadTax = async (start: string, end: string) => {
    setTaxLoading(true);
    setTaxError(null);
    try {
      const res = await getTaxComplianceReport(start, end);
      if (res.success) {
        setTaxData(res.data);
      } else {
        setTaxError(res.error || "Failed to load Tax report.");
      }
    } catch (e: any) {
      setTaxError(e.message || "An unexpected error occurred.");
    } finally {
      setTaxLoading(false);
    }
  };

  useEffect(() => {
    loadPL(plDate);
  }, [plDate]);

  useEffect(() => {
    loadTax(taxStartDate, taxEndDate);
  }, [taxStartDate, taxEndDate]);

  // Generate Email HTML string
  const generateEmailHtml = (type: "pl" | "tax", data: any) => {
    if (type === "pl") {
      const costOfSales = data.stats.totalSales - data.stats.totalProfit;
      const formattedDate = new Date(data.date).toLocaleDateString("en-KE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #171d1a; padding: 20px; border: 1px solid #e4eae4; border-radius: 16px;">
          <h2 style="color: #00694c; margin-bottom: 5px;">${data.storeName}</h2>
          <p style="color: #6d7a73; font-size: 12px; margin-top: 0;">Daily Sales & Profit/Loss Statement</p>
          <hr style="border: 0; border-top: 2px solid #00694c; margin: 20px 0;" />
          <h3 style="margin-top: 0; font-size: 16px;">Summary for ${formattedDate}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #6d7a73;">Total Revenue (Sales)</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">KES ${Number(data.stats.totalSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #6d7a73;">Cost of Sales</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">KES ${Number(costOfSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #00694c;">Gross Profit</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #00694c;">KES ${Number(data.stats.totalProfit).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #ba1a1a;">Operating Expenses</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ba1a1a;">- KES ${Number(data.stats.totalExpenses).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #171d1a;">Net Cash P&L</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${data.stats.netPL >= 0 ? "#00694c" : "#ba1a1a"};">KES ${Number(data.stats.netPL).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 2px solid #00694c;">
              <td style="padding: 10px 0; font-weight: bold; color: #171d1a;">True Net Profit (Margin)</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${data.stats.netProfitMargin >= 0 ? "#00694c" : "#ba1a1a"};">KES ${Number(data.stats.netProfitMargin).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>

          <h4 style="margin-bottom: 10px;">Itemized Items Sold</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f8faf9;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e4eae4;">Item Name</th>
                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e4eae4;">Qty</th>
                <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e4eae4;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${data.itemsSold.length === 0 
                ? '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #6d7a73;">No items sold today.</td></tr>' 
                : data.itemsSold.map((item: any) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e4eae4;">${item.name}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e4eae4;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #e4eae4;">KES ${Number(item.revenue).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
          
          <p style="font-size: 11px; color: #6d7a73; text-align: center; margin-top: 30px;">Generated automatically by Akiba AI System</p>
        </div>
      `;
    } else {
      const formatD = (dStr: string) => new Date(dStr).toLocaleDateString("en-KE", {
        year: "numeric", month: "long", day: "numeric"
      });

      return `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #171d1a; padding: 20px; border: 1px solid #e4eae4; border-radius: 16px;">
          <h2 style="color: #584fbc; margin-bottom: 5px;">${data.storeName}</h2>
          <p style="color: #6d7a73; font-size: 12px; margin-top: 0;">KRA VAT Compliance Report Summary</p>
          <hr style="border: 0; border-top: 2px solid #584fbc; margin: 20px 0;" />
          <h3 style="margin-top: 0; font-size: 16px;">Report Period: ${formatD(data.startDate)} to ${formatD(data.endDate)}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #6d7a73;">Gross Sales (VAT Inclusive)</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">KES ${Number(data.metrics.grossSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #6d7a73;">Taxable Sales (16% excl. VAT)</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">KES ${Number(data.metrics.taxableSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4eae4;">
              <td style="padding: 10px 0; font-weight: bold; color: #6d7a73;">Exempt Sales (0% VAT)</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold;">KES ${Number(data.metrics.exemptSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="border-bottom: 2px solid #584fbc;">
              <td style="padding: 10px 0; font-weight: bold; color: #584fbc;">VAT Output Payable (16% collected)</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #584fbc; font-size: 16px;">KES ${Number(data.metrics.vatPayable).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>

          <div style="background-color: #f8faf9; padding: 12px; border-radius: 8px; font-size: 12px; color: #3d4943;">
            <strong>Store Tax Details:</strong><br/>
            KRA PIN: ${data.kraPin || "Not Configured"}<br/>
            eTIMS Serial: ${data.etimsSerial || "Not Configured"}
          </div>
          
          <p style="font-size: 11px; color: #6d7a73; text-align: center; margin-top: 30px;">Generated automatically by Akiba AI System</p>
        </div>
      `;
    }
  };

  // Generate plain-text for mailto link fallback
  const getMailtoLink = (type: "pl" | "tax", data: any) => {
    let subject = "";
    let body = "";

    if (type === "pl") {
      const formattedDate = new Date(data.date).toLocaleDateString("en-KE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      });
      subject = `${data.storeName} - EOD Sales & P&L Summary [${data.date}]`;
      
      const costOfSales = data.stats.totalSales - data.stats.totalProfit;
      body = `DAILY SALES & P&L REPORT - ${formattedDate}\n`;
      body += `Store: ${data.storeName}\n`;
      body += `-------------------------------------------\n\n`;
      body += `FINANCIAL METRICS:\n`;
      body += `- Total Sales Revenue: KES ${Number(data.stats.totalSales).toFixed(2)}\n`;
      body += `- Cost of Goods Sold: KES ${Number(costOfSales).toFixed(2)}\n`;
      body += `- Gross Profit Margin: KES ${Number(data.stats.totalProfit).toFixed(2)}\n`;
      body += `- Total Cash Out/Expenses: KES ${Number(data.stats.totalExpenses).toFixed(2)}\n`;
      body += `- Net Cash Flow (Sales - Expenses): KES ${Number(data.stats.netPL).toFixed(2)}\n`;
      body += `- True Net Profit (Gross Profit - Expenses): KES ${Number(data.stats.netProfitMargin).toFixed(2)}\n\n`;
      
      body += `ITEMIZED BREAKDOWN OF ITEMS SOLD:\n`;
      if (data.itemsSold.length === 0) {
        body += `No items sold on this day.\n`;
      } else {
        data.itemsSold.forEach((item: any) => {
          body += `- ${item.name}: Qty ${item.quantity} | Revenue KES ${Number(item.revenue).toFixed(2)} | VAT KES ${Number(item.vat).toFixed(2)}\n`;
        });
      }
      body += `\n`;
      body += `OPERATING EXPENSES / CASH DRAWER OUTS:\n`;
      if (data.expenses.length === 0) {
        body += `No operating expenses logged on this day.\n`;
      } else {
        data.expenses.forEach((e: any) => {
          body += `- KES ${Number(e.amount).toFixed(2)} | Reason: ${e.reason}\n`;
        });
      }
    } else {
      subject = `${data.storeName} - KRA VAT Return Summary [${data.startDate} to ${data.endDate}]`;
      body = `KRA VAT RETURN SUMMARY\n`;
      body += `Period: ${data.startDate} to ${data.endDate}\n`;
      body += `Store: ${data.storeName}\n`;
      body += `KRA PIN: ${data.kraPin || "N/A"}\n`;
      body += `eTIMS Serial: ${data.etimsSerial || "N/A"}\n`;
      body += `-------------------------------------------\n\n`;
      body += `- Gross Sales (VAT Inclusive): KES ${Number(data.metrics.grossSales).toFixed(2)}\n`;
      body += `- Taxable Sales (16% excl. VAT): KES ${Number(data.metrics.taxableSales).toFixed(2)}\n`;
      body += `- Exempt Sales (0% VAT): KES ${Number(data.metrics.exemptSales).toFixed(2)}\n`;
      body += `- VAT Output Payable (16% collected): KES ${Number(data.metrics.vatPayable).toFixed(2)}\n\n`;
    }

    body += `\nGenerated via Akiba AI System.`;

    return `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);
    setShowMailtoFallback(false);

    const reportData = emailTarget === "pl" ? plData : taxData;
    if (!reportData) {
      setEmailError("No report data loaded to send.");
      setSendingEmail(false);
      return;
    }

    const subject = emailTarget === "pl" 
      ? `EOD Sales & P&L Statement for ${new Date(plDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} - ${reportData.storeName}`
      : `KRA Tax Return Compliance Summary [${taxStartDate} to ${taxEndDate}] - ${reportData.storeName}`;

    const html = generateEmailHtml(emailTarget, reportData);

    try {
      const res = await sendReportEmail(emailAddress, subject, html);
      if (res.success) {
        setEmailSuccess(true);
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailSuccess(false);
        }, 2000);
      } else {
        if (res.fallback) {
          setShowMailtoFallback(true);
        } else {
          setEmailError(res.error || "Failed to send email.");
        }
      }
    } catch (e: any) {
      setEmailError(e.message || "An unexpected error occurred.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Modern Printing
  const handlePrintDailyPL = (data: any, date: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print/download the report");
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString("en-KE", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const costOfSales = data.stats.totalSales - data.stats.totalProfit;
    const grossProfit = data.stats.totalProfit;

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily P&L Statement - ${date}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #171d1a;
              padding: 40px;
              margin: 0;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #00694c;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .store-name {
              font-size: 24px;
              font-weight: 800;
              color: #00694c;
              margin: 0 0 5px 0;
            }
            .store-info {
              color: #6d7a73;
              font-size: 11px;
              font-weight: 600;
              line-height: 1.4;
            }
            .report-title {
              text-align: right;
              margin: 0;
            }
            .report-title h1 {
              font-size: 20px;
              font-weight: 800;
              color: #171d1a;
              margin: 0 0 5px 0;
            }
            .report-title p {
              font-size: 12px;
              font-weight: 600;
              color: #6d7a73;
              margin: 0;
            }
            .grid-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 40px;
            }
            .stat-card {
              background-color: #f8faf9;
              border: 1px solid #e4eae4;
              border-radius: 12px;
              padding: 15px;
            }
            .stat-card.highlight {
              background-color: #f0fdf4;
              border-color: #00694c/20;
            }
            .stat-label {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #6d7a73;
              margin-bottom: 5px;
            }
            .stat-val {
              font-size: 18px;
              font-weight: 800;
              color: #171d1a;
            }
            .stat-val.profit {
              color: #00694c;
            }
            .stat-val.expense {
              color: #ba1a1a;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #171d1a;
              border-bottom: 1px solid #e4eae4;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              font-weight: 800;
              text-align: left;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.05em;
              color: #6d7a73;
              padding: 10px 12px;
              border-bottom: 2px solid #e4eae4;
              background-color: #f8faf9;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e4eae4;
              color: #171d1a;
              font-weight: 500;
            }
            .text-right {
              text-align: right;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e4eae4;
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              font-weight: 600;
              color: #bccac1;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-top">
              <div>
                <h2 class="store-name">${data.storeName}</h2>
                <div class="store-info">
                  ${initialSettings.storeAddress ? `<div>${initialSettings.storeAddress}</div>` : ""}
                  ${initialSettings.storePhone ? `<div>Tel: ${initialSettings.storePhone}</div>` : ""}
                  ${initialSettings.storeEmail ? `<div>Email: ${initialSettings.storeEmail}</div>` : ""}
                  ${initialSettings.kraPin ? `<div>KRA PIN: ${initialSettings.kraPin}</div>` : ""}
                  ${initialSettings.etimsSerial ? `<div>eTIMS S/N: ${initialSettings.etimsSerial}</div>` : ""}
                </div>
              </div>
              <div class="report-title">
                <h1>DAILY P&L STATEMENT</h1>
                <p>${formattedDate}</p>
              </div>
            </div>
          </div>

          <div class="grid-stats">
            <div class="stat-card">
              <div class="stat-label">Total Sales Cash Flow</div>
              <div class="stat-val">KES ${Number(data.stats.totalSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Cost of Sales</div>
              <div class="stat-val">KES ${Number(costOfSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-label">Gross Profit (Margin)</div>
              <div class="stat-val profit">KES ${Number(grossProfit).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Operating Expenses</div>
              <div class="stat-val expense">KES ${Number(data.stats.totalExpenses).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-label">Net Cash P&L</div>
              <div class="stat-val ${data.stats.netPL >= 0 ? "profit" : "expense"}">
                KES ${Number(data.stats.netPL).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-label">True Net Profit</div>
              <div class="stat-val ${data.stats.netProfitMargin >= 0 ? "profit" : "expense"}">
                KES ${Number(data.stats.netProfitMargin).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div class="section-title">Itemized Sales Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th class="text-right">Quantity Sold</th>
                <th class="text-right">VAT Collected</th>
                <th class="text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${data.itemsSold.length === 0 
                ? '<tr><td colspan="4" style="text-align: center; color: #6d7a73;">No items sold on this day.</td></tr>' 
                : data.itemsSold.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">KES ${Number(item.vat).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">KES ${Number(item.revenue).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>

          <div class="section-title">Operating Expenses / Cash Out</div>
          <table>
            <thead>
              <tr>
                <th>Time Logged</th>
                <th>Reason / Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.expenses.length === 0 
                ? '<tr><td colspan="3" style="text-align: center; color: #6d7a73;">No operating expenses logged on this day.</td></tr>' 
                : data.expenses.map((exp: any) => `
                  <tr>
                    <td>${new Date(exp.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>${exp.reason}</td>
                    <td class="text-right" style="color: #ba1a1a; font-weight: bold;">- KES ${Number(exp.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>

          <div class="footer">
            <div>Generated by Akiba AI System</div>
            <div>Page 1 of 1</div>
            <div>Date Generated: ${new Date().toLocaleString("en-KE")}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintTaxReport = (data: any, startDate: string, endDate: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print/download the report");
      return;
    }

    const formatD = (dStr: string) => new Date(dStr).toLocaleDateString("en-KE", {
      year: "numeric", month: "long", day: "numeric",
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>KRA VAT Return Summary - ${startDate} to ${endDate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #171d1a;
              padding: 40px;
              margin: 0;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #584fbc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .store-name {
              font-size: 24px;
              font-weight: 800;
              color: #584fbc;
              margin: 0 0 5px 0;
            }
            .store-info {
              color: #6d7a73;
              font-size: 11px;
              font-weight: 600;
              line-height: 1.4;
            }
            .report-title {
              text-align: right;
              margin: 0;
            }
            .report-title h1 {
              font-size: 20px;
              font-weight: 800;
              color: #171d1a;
              margin: 0 0 5px 0;
            }
            .report-title p {
              font-size: 12px;
              font-weight: 600;
              color: #6d7a73;
              margin: 0;
            }
            .grid-stats {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 40px;
            }
            .stat-card {
              background-color: #f8faf9;
              border: 1px solid #e4eae4;
              border-radius: 12px;
              padding: 18px;
            }
            .stat-card.highlight {
              background-color: #f5f3ff;
              border-color: #584fbc/20;
            }
            .stat-label {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #6d7a73;
              margin-bottom: 5px;
            }
            .stat-val {
              font-size: 22px;
              font-weight: 800;
              color: #171d1a;
            }
            .stat-val.tax {
              color: #584fbc;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #171d1a;
              border-bottom: 1px solid #e4eae4;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .table-summary {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            .table-summary tr {
              border-bottom: 1px solid #e4eae4;
            }
            .table-summary td {
              padding: 12px 15px;
              font-size: 13px;
            }
            .table-summary td.label {
              font-weight: 800;
              color: #3d4943;
              width: 60%;
            }
            .table-summary td.value {
              font-weight: 800;
              color: #171d1a;
              text-align: right;
            }
            .table-summary td.highlight-value {
              color: #584fbc;
              font-size: 15px;
            }
            .alert-banner {
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              color: #b45309;
              padding: 15px;
              border-radius: 12px;
              font-weight: 600;
              margin-bottom: 30px;
              font-size: 12px;
            }
            .signature-section {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .sig-line {
              width: 200px;
              border-top: 1px solid #6d7a73;
              margin-top: 50px;
              text-align: center;
              font-size: 10px;
              font-weight: 800;
              color: #6d7a73;
              text-transform: uppercase;
              padding-top: 5px;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e4eae4;
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              font-weight: 600;
              color: #bccac1;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-top">
              <div>
                <h2 class="store-name">${data.storeName}</h2>
                <div class="store-info">
                  ${initialSettings.storeAddress ? `<div>${initialSettings.storeAddress}</div>` : ""}
                  ${initialSettings.storePhone ? `<div>Tel: ${initialSettings.storePhone}</div>` : ""}
                  ${initialSettings.storeEmail ? `<div>Email: ${initialSettings.storeEmail}</div>` : ""}
                  ${initialSettings.kraPin ? `<div>KRA PIN: ${initialSettings.kraPin}</div>` : ""}
                  ${initialSettings.etimsSerial ? `<div>eTIMS S/N: ${initialSettings.etimsSerial}</div>` : ""}
                </div>
              </div>
              <div class="report-title">
                <h1>KRA VAT RETURN SUMMARY</h1>
                <p>Period: ${formatD(startDate)} - ${formatD(endDate)}</p>
              </div>
            </div>
          </div>

          ${!initialSettings.taxComplianceEnabled ? `
            <div class="alert-banner">
              WARNING: Tax Compliance settings are disabled for this store. These figures are for advisory purposes only. Update settings to enable eTIMS.
            </div>
          ` : ""}

          <div class="grid-stats">
            <div class="stat-card">
              <div class="stat-label">Gross Sales (VAT Incl.)</div>
              <div class="stat-val">KES ${Number(data.metrics.grossSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-label">VAT Payable (16% Collected)</div>
              <div class="stat-val tax">KES ${Number(data.metrics.vatPayable).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="section-title">KRA iTax Return Fields Map</div>
          <table class="table-summary">
            <tbody>
              <tr>
                <td class="label">Taxable Sales (Standard Rate 16% - Net of VAT)</td>
                <td class="value">KES ${Number(data.metrics.taxableSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="label">Exempt Sales (Zero Rated / Exempt 0%)</td>
                <td class="value">KES ${Number(data.metrics.exemptSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="label">Total Taxable Sales (Excluding VAT)</td>
                <td class="value">KES ${Number(data.metrics.taxableSales + data.metrics.exemptSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="label" style="border-top: 2px solid #e4eae4;">Output VAT (16% VAT Collected)</td>
                <td class="value highlight-value" style="border-top: 2px solid #e4eae4;">KES ${Number(data.metrics.vatPayable).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Declaration & Signature</div>
          <p style="font-size: 11px; color: #6d7a73; font-weight: 500; max-width: 500px;">
            I declare that the information provided in this report has been compiled from the transaction logs of ${data.storeName} and is, to the best of my knowledge, correct and complete.
          </p>

          <div class="signature-section">
            <div class="sig-line">Prepared By (Signature)</div>
            <div class="sig-line">Approved By (Signature)</div>
          </div>

          <div class="footer">
            <div>Generated by Akiba AI System</div>
            <div>Page 1 of 1</div>
            <div>Date Generated: ${new Date().toLocaleString("en-KE")}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[11px] font-black text-[#00694c] uppercase tracking-[0.25em] bg-[#f0fdf4] px-4 py-2 rounded-full border border-[#00694c]/10">
            Analytics & Reports
          </span>
          <h1 className="text-4xl font-black text-[#171d1a] tracking-tight mt-3">
            Financial &amp; Tax Compliance
          </h1>
          <p className="text-sm font-semibold text-[#6d7a73] mt-2">
            Generate and export End-of-Day statements, P&L reports, and compile VAT summaries for KRA filing.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f0fdf4] border border-[#e4eae4] p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("pl")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "pl"
                ? "bg-[#171d1a] text-white shadow-lg shadow-black/10"
                : "text-[#6d7a73] hover:text-[#171d1a]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            Daily P&amp;L
          </button>
          <button
            onClick={() => setActiveTab("tax")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "tax"
                ? "bg-[#584fbc] text-white shadow-lg shadow-[#584fbc]/10"
                : "text-[#6d7a73] hover:text-[#171d1a]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            KRA Return
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "pl" ? (
          <motion.div
            key="pl-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Filters Row */}
            <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="material-symbols-outlined text-[#00694c]">calendar_today</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#6d7a73] uppercase tracking-wider">Select Statement Date</span>
                  <input
                    type="date"
                    value={plDate}
                    max={getTodayString()}
                    onChange={(e) => setPlDate(e.target.value)}
                    className="bg-transparent border-0 font-bold text-sm text-[#171d1a] focus:ring-0 p-0 cursor-pointer outline-none"
                  />
                </div>
              </div>

              {plData && (
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setEmailTarget("pl");
                      setEmailModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 h-11 px-5 bg-white border border-[#e4eae4] hover:bg-[#f8faf9] text-[#171d1a] rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Email Summary
                  </button>
                  <button
                    onClick={() => handlePrintDailyPL(plData, plDate)}
                    className="flex items-center justify-center gap-2 h-11 px-5 bg-[#171d1a] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Print / PDF
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {plError && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">error</span>
                {plError}
              </div>
            )}

            {/* P&L Main State */}
            {plLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#6d7a73]">
                <div className="w-10 h-10 border-4 border-[#00694c] border-t-transparent rounded-full animate-spin mb-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Compiling daily statement...</span>
              </div>
            ) : plData ? (
              <>
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Sales Inflow */}
                  <div className="col-span-1 lg:col-span-2 bg-white border border-[#e4eae4] rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
                    <span className="text-[10px] font-black text-[#6d7a73] uppercase tracking-wider block">Sales Revenue</span>
                    <span className="text-2xl font-black text-[#171d1a] tracking-tight block mt-2">
                      KES {Number(plData.stats.totalSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-semibold text-[#00694c] block mt-1">
                      {plData.stats.totalTransactions} cash transactions
                    </span>
                  </div>

                  {/* COGS */}
                  <div className="col-span-1 lg:col-span-1 bg-white border border-[#e4eae4] rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
                    <span className="text-[10px] font-black text-[#6d7a73] uppercase tracking-wider block">Cost of Sales</span>
                    <span className="text-xl font-black text-[#6d7a73] block mt-2">
                      KES {Number(plData.stats.totalSales - plData.stats.totalProfit).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-semibold text-[#bccac1] block mt-1">
                      Stock buying cost
                    </span>
                  </div>

                  {/* Gross Profit */}
                  <div className="col-span-1 lg:col-span-1 bg-white border border-[#00694c]/20 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all bg-gradient-to-tr from-[#f0fdf4] to-white">
                    <span className="text-[10px] font-black text-[#00694c] uppercase tracking-wider block">Gross Profit</span>
                    <span className="text-xl font-black text-[#00694c] block mt-2">
                      KES {Number(plData.stats.totalProfit).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-semibold text-[#00694c]/80 block mt-1">
                      Goods markup margin
                    </span>
                  </div>

                  {/* Cash Drawer Expenses */}
                  <div className="col-span-1 lg:col-span-1 bg-white border border-red-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all bg-gradient-to-tr from-red-50/50 to-white">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-wider block">Drawer Expenses</span>
                    <span className="text-xl font-black text-red-600 block mt-2">
                      - KES {Number(plData.stats.totalExpenses).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-semibold text-red-600/80 block mt-1">
                      Paid out of drawer
                    </span>
                  </div>

                  {/* Net Cash Flow */}
                  <div className="col-span-2 lg:col-span-1 bg-[#171d1a] rounded-[24px] p-5 shadow-lg text-white">
                    <span className="text-[10px] font-black text-[#bccac1] uppercase tracking-wider block">Net Cash Flow</span>
                    <span className="text-xl font-black block mt-2">
                      KES {Number(plData.stats.netPL).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] font-bold text-[#00a87a] block mt-1 uppercase tracking-wider">
                      Sales - Expenses
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Itemized Sales Breakdown */}
                  <div className="lg:col-span-7 bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm">
                    <h3 className="text-base font-black text-[#171d1a] tracking-tight mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00694c]">shopping_bag</span>
                      Itemized Daily Sales Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold text-[#3d4943]">
                        <thead>
                          <tr className="border-b border-[#e4eae4] text-[#6d7a73] font-black text-[10px] uppercase tracking-wider">
                            <th className="pb-3">Product Name</th>
                            <th className="pb-3 text-right">Qty Sold</th>
                            <th className="pb-3 text-right">VAT Collected</th>
                            <th className="pb-3 text-right">Total Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plData.itemsSold.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-[#bccac1]">No products sold on this date.</td>
                            </tr>
                          ) : (
                            plData.itemsSold.map((item: any, i: number) => (
                              <tr key={i} className="border-b border-[#e4eae4] last:border-0 hover:bg-[#f8faf9] transition-colors">
                                <td className="py-3.5 text-[#171d1a] font-bold">{item.name}</td>
                                <td className="py-3.5 text-right">{item.quantity}</td>
                                <td className="py-3.5 text-right">KES {Number(item.vat).toFixed(2)}</td>
                                <td className="py-3.5 text-right text-[#171d1a] font-bold">KES {Number(item.revenue).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expenses List */}
                  <div className="lg:col-span-5 bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm">
                    <h3 className="text-base font-black text-[#171d1a] tracking-tight mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ba1a1a]">payments</span>
                      Cash Drawer Payouts / Expenses Ledger
                    </h3>
                    <div className="space-y-3">
                      {plData.expenses.length === 0 ? (
                        <div className="py-12 text-center text-[#bccac1] font-bold text-xs">
                          No operating expenses logged on this date.
                        </div>
                      ) : (
                        plData.expenses.map((exp: any) => (
                          <div key={exp.id} className="p-4 border border-[#e4eae4] rounded-xl flex items-center justify-between hover:bg-red-50/10 transition-colors">
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className="text-xs font-black text-[#171d1a] truncate">{exp.reason}</span>
                              <span className="text-[10px] font-semibold text-[#bccac1] mt-0.5">
                                {new Date(exp.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <span className="text-sm font-black text-red-600 flex-shrink-0">
                              - KES {Number(exp.amount).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="tax-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Filters Row */}
            <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="material-symbols-outlined text-[#584fbc]">date_range</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#6d7a73] uppercase tracking-wider">Start Date</span>
                    <input
                      type="date"
                      value={taxStartDate}
                      max={taxEndDate}
                      onChange={(e) => setTaxStartDate(e.target.value)}
                      className="bg-transparent border-0 font-bold text-sm text-[#171d1a] focus:ring-0 p-0 cursor-pointer outline-none"
                    />
                  </div>
                </div>
                
                <div className="hidden sm:block text-[#bccac1] font-black">→</div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="material-symbols-outlined text-[#584fbc]">date_range</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#6d7a73] uppercase tracking-wider">End Date</span>
                    <input
                      type="date"
                      value={taxEndDate}
                      min={taxStartDate}
                      max={getTodayString()}
                      onChange={(e) => setTaxEndDate(e.target.value)}
                      className="bg-transparent border-0 font-bold text-sm text-[#171d1a] focus:ring-0 p-0 cursor-pointer outline-none"
                    />
                  </div>
                </div>
              </div>

              {taxData && (
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      setEmailTarget("tax");
                      setEmailModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 h-11 px-5 bg-white border border-[#e4eae4] hover:bg-[#f8faf9] text-[#171d1a] rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Email Return Summary
                  </button>
                  <button
                    onClick={() => handlePrintTaxReport(taxData, taxStartDate, taxEndDate)}
                    className="flex items-center justify-center gap-2 h-11 px-5 bg-[#584fbc] hover:bg-[#2b1c8f] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Print Tax Return
                  </button>
                </div>
              )}
            </div>

            {/* Compliance Banner */}
            {!initialSettings.taxComplianceEnabled ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[28px] text-amber-700">warning</span>
                  <div>
                    <span className="font-black block text-amber-900">Tax Compliance Settings Disabled</span>
                    <span className="text-xs font-medium text-amber-800">
                      Enable KRA Tax settings in the settings page to start calculating line-item VAT at checkout and producing eTIMS tax invoices.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = "/settings"}
                  className="px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors shrink-0 cursor-pointer"
                >
                  Configure Tax Settings
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#00694c]/20 text-[#00694c] text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  <span>Store eTIMS integration active. KRA PIN: {initialSettings.kraPin} | Serial: {initialSettings.etimsSerial}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {taxError && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">error</span>
                {taxError}
              </div>
            )}

            {/* Tax Main State */}
            {taxLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#6d7a73]">
                <div className="w-10 h-10 border-4 border-[#584fbc] border-t-transparent rounded-full animate-spin mb-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Aggregating VAT transactions...</span>
              </div>
            ) : taxData ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Metrics Breakdown */}
                <div className="lg:col-span-7 bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-black text-[#171d1a] tracking-tight">
                      KRA Returns Form Mapping
                    </h3>
                    <p className="text-xs font-semibold text-[#6d7a73] mt-1">
                      Use these aggregated figures when compiling your monthly VAT-3 return sheets on KRA iTax portal.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#171d1a]">Taxable Sales (Standard Rate 16%)</span>
                        <span className="text-[10px] font-semibold text-[#6d7a73] mt-0.5">Excludes VAT amount</span>
                      </div>
                      <span className="text-sm font-black text-[#171d1a]">
                        KES {Number(taxData.metrics.taxableSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#171d1a]">Exempt Sales (Zero Rated / Exempt 0%)</span>
                        <span className="text-[10px] font-semibold text-[#6d7a73] mt-0.5">Products flagged with 0% VAT rate</span>
                      </div>
                      <span className="text-sm font-black text-[#171d1a]">
                        KES {Number(taxData.metrics.exemptSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-4 bg-[#f5f3ff] border border-[#584fbc]/20 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#584fbc]">Output VAT Payable (16% Collected)</span>
                        <span className="text-[10px] font-semibold text-[#584fbc]/80 mt-0.5">Total standard-rate tax collected</span>
                      </div>
                      <span className="text-base font-black text-[#584fbc]">
                        KES {Number(taxData.metrics.vatPayable).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <hr className="border-[#e4eae4]" />

                    <div className="p-4 bg-[#171d1a] text-white rounded-xl flex items-center justify-between">
                      <span className="text-xs font-black">Gross Revenue (VAT Inclusive)</span>
                      <span className="text-base font-black">
                        KES {Number(taxData.metrics.grossSales).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tax Instructions / Info */}
                <div className="lg:col-span-5 bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-[#171d1a] tracking-tight flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#584fbc]">info</span>
                      How to file KRA iTax Returns
                    </h3>
                    <ol className="list-decimal pl-4 text-xs font-semibold text-[#6d7a73] space-y-3">
                      <li>
                        Log in to your <strong>KRA iTax Portal</strong> using your PIN and password.
                      </li>
                      <li>
                        Navigate to <strong>Returns &gt; File Return</strong> and select <strong>Value Added Tax (VAT)</strong>.
                      </li>
                      <li>
                        Download the excel Return template and go to <strong>Section B (Sales details)</strong>.
                      </li>
                      <li>
                        Copy the <strong>Taxable Sales</strong> and <strong>Output VAT Payable</strong> from the dashboard table and paste into the corresponding fields.
                      </li>
                      <li>
                        Validate the spreadsheet, export it to zip, and upload to the iTax portal to submit.
                      </li>
                    </ol>
                  </div>

                  <div className="mt-8 p-4 bg-[#f8faf9] border border-[#e4eae4] rounded-2xl text-[11px] font-medium text-[#6d7a73] leading-relaxed">
                    💡 <strong>Tip:</strong> You can download the full return summary sheet in PDF format by clicking the <strong>Print Tax Return</strong> button above. Maintain these records locally for audits.
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Share Modal */}
      <AnimatePresence>
        {emailModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#e4eae4] rounded-[32px] max-w-md w-full p-6 shadow-2xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-[#171d1a]">
                  Email {emailTarget === "pl" ? "Daily P&L" : "VAT Return"} Report
                </h3>
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="material-symbols-outlined text-[#bccac1] hover:text-[#171d1a] cursor-pointer"
                >
                  close
                </button>
              </div>

              {emailError && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                  {emailError}
                </div>
              )}

              {emailSuccess ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-[48px] text-emerald-600 mb-3">check_circle</span>
                  <span className="text-sm font-bold text-emerald-800">Report sent successfully!</span>
                </div>
              ) : showMailtoFallback ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl leading-relaxed">
                    ⚠️ <strong>RESEND_API_KEY is not configured.</strong><br/>
                    We cannot send direct automated emails from our server. However, you can send it instantly using your device's default email app (Outlook, Mail, Gmail, etc.) using the button below:
                  </div>

                  <a
                    href={getMailtoLink(emailTarget, emailTarget === "pl" ? plData : taxData)}
                    onClick={() => setEmailModalOpen(false)}
                    className="flex items-center justify-center gap-2 w-full h-12 bg-[#00694c] hover:bg-[#00573e] text-white rounded-xl text-xs font-bold transition-all shadow-md text-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Send via Email Client App
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="e.g. manager@shop.co.ke"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-2xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailAddress.trim()}
                    className="w-full h-12 rounded-2xl font-black text-xs text-white bg-[#171d1a] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
