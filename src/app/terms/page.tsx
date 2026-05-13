import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service | Akiba AI",
  description: "Terms and conditions for using Akiba AI's intelligent inventory management services.",
};

export default function Terms() {
  return <TermsClient />;
}
