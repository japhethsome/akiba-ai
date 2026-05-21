import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | Akiba AI",
  description: "Get in touch with Akiba AI for intelligent inventory management support and business solutions in Kenya.",
};

export default function ContactPage() {
  return <ContactClient />;
}
