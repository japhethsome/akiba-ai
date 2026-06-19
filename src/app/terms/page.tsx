import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service | Akiba Yangu",
  description: "Terms and conditions for using Akiba Yangu's intelligent inventory management services.",
};

export default function Terms() {
  return <TermsClient />;
}
