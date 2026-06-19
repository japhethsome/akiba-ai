import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | Akiba Yangu",
  description: "Get in touch with Akiba Yangu for intelligent inventory management support and business solutions in Kenya.",
};

export default function ContactPage() {
  return <ContactClient />;
}
