import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Akiba AI",
  description: "How Akiba AI protects your business data and ensures secure inventory management for Kenyan SMEs.",
};

export default function Privacy() {
  return <PrivacyClient />;
}
