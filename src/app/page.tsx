import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Akiba AI | Intelligent Inventory for Kenyan SMEs",
  description: "Never run out of stock. Akiba AI uses predictive intelligence to help Kenyan shop owners manage inventory and grow their profits in English and Kiswahili.",
  keywords: ["Inventory Management", "Kenya SME", "AI Business", "Stock Forecasting", "M-Pesa POS", "Akiba AI"],
  openGraph: {
    title: "Akiba AI - Smart Business. Stronger Profits.",
    description: "The AI-powered operating system for your shop.",
    images: ["/hero.png"],
  },
};

export default function Home() {
  return <HomeClient />;
}
