import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  title: "Login & Register | Akiba AI",
  description: "Join 500+ Kenyan businesses. Sign in to your Akiba AI account to manage your store inventory and view AI insights.",
};

import { Suspense } from "react";

export default function Auth() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-[#00694c] font-black uppercase tracking-widest animate-pulse">Loading Akiba AI...</div>}>
      <AuthClient />
    </Suspense>
  );
}
