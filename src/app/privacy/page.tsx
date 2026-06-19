import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Akiba Yangu",
  description: "How Akiba Yangu protects your business data and ensures secure inventory management for Kenyan SMEs.",
};

export default function Privacy() {
  return <PrivacyClient />;
}
