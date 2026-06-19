import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Akiba Yangu | Intelligent Inventory for Kenyan SMEs",
  description: "Never run out of stock. Akiba Yangu uses predictive intelligence to help Kenyan shop owners manage inventory and grow their profits in English and Kiswahili.",
  keywords: ["Inventory Management", "Kenya SME", "AI Business", "Stock Forecasting", "M-Pesa POS", "Akiba Yangu"],
  openGraph: {
    title: "Akiba Yangu - Smart Business. Stronger Profits.",
    description: "The AI-powered operating system for your shop.",
    images: ["/hero.png"],
  },
};

import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  const isLoggedIn = !!session;
  
  return <HomeClient isLoggedIn={isLoggedIn} />;
}
