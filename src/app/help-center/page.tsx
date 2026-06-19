import { Metadata } from "next";
import HelpCenterClient from "./HelpCenterClient";

export const metadata: Metadata = {
  title: "Help Center | Akiba Yangu",
  description: "Get support with managing your inventory, processing payments, and configuring AI demand predictions on Akiba Yangu.",
};

export default function HelpCenterPage() {
  return <HelpCenterClient />;
}
