# 🇰🇪 Akiba AI

> **Akiba AI** is a premium, AI-driven inventory operating system and Point-of-Sale (POS) terminal tailored specifically for Kenyan Small and Medium Enterprises (SMEs). 

Akiba AI helps store owners track stock, physically register attendants, process transactions, link suppliers, and chat with a localized AI assistant trained directly on their active store inventory and sales ledger.

---

## ✨ Features

### 1.  Central Analytics Dashboard
*   **Key Performance Indicators (KPIs):** Real-time monitoring of Gross Sales, Net Profit, Profit Margins, and Low-Stock counts.
*   **Intelligence Bento Card:** Quick summary prompts driven by AI analysis.
*   **Store Owner Exclusivity:** Fully hidden from attendants to protect business sensitive metrics.

### 2.  Advanced Inventory & Supplier Sourcing
*   **Price Adjustment Control:** Edit buying and selling prices dynamically.
*   **Supplier Directory Mapping:** Associate individual inventory products to wholesalers, detailing lead times and vendor contact info.
*   **Smart Restock Triggers:** Displays low-stock alerts relative to custom reorder levels.

### 3.  Attendant POS Terminal
*   **Fast-Checkout Grid:** Interactive cart builder with quantity triggers.
*   **Instant Cart Discounts:** One-click toggles for applying 5% or 10% discounts.
*   **Payment Success Receipt:** Instantly populates receipt outlines displaying transaction ids, profit tallies, and clean print interfaces.

### 4.  Staff Management & Strict Role-Based Access Control (RBAC)
*   **InPerson Registration:** Owners can physically set up clerk profiles with secure credentials on the spot.
*   **Attendant Constraints:** Clerks are immediately locked to the POS and basic Inventory lists. Sensitive pages (Staff setup, Suppliers dashboard, Profit reports, AI forecasts) are completely inaccessible and hidden from their navigation bars.

### 5. Smart AI Assistant (RAG Enabled)
*   **Free Engine Power:** Integrated with **Google Gemini 3.1 Flash-Lite** .
*   **Retrieval-Augmented Generation (RAG):** The model is dynamically "trained" with live shop data. Every query automatically fetches store configuration, active suppliers, low-stock items, and recent sales logs to give tailored business recommendations.

---

## 🛠️ Tech Stack

*   **Framework:** Next.js (App Router, compiled with Turbopack)
*   **Database ORM:** Prisma ORM
*   **Database Server:** Neon Serverless PostgreSQL
*   **Styling:** Tailwind CSS & Vanilla CSS (Glassmorphism layout design)
*   **Animations:** Framer Motion
*   **AI Engine:** Google Gemini API (`gemini-3.1-flash-lite` via `v1beta` REST)
*   **Security:** Cryptographic session-cookie tokens & Bcrypt password hashing

---

