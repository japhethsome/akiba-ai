import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  title: "Login & Register | Akiba AI",
  description: "Join 500+ Kenyan businesses. Sign in to your Akiba AI account to manage your store inventory and view AI insights.",
};

export default function Auth() {
  return <AuthClient />;
}
