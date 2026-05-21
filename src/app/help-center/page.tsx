import { Metadata } from "next";
import HelpCenterClient from "./HelpCenterClient";

export const metadata: Metadata = {
  title: "Help Center | Akiba AI",
  description: "Get support with managing your inventory, processing payments, and configuring AI demand predictions on Akiba AI.",
};

export default function HelpCenterPage() {
  return <HelpCenterClient />;
}
