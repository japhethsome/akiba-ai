import React from "react";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import { AiChatBubble } from "./AiChatBubble";

import { getSession } from "@/lib/session";

export async function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session?.role || "clerk";

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full bg-[#f8faf9] text-[#171d1a] font-sans selection:bg-[#00a87a]/20 relative overflow-x-hidden">
      <TopNav userRole={role} />
      {/* pb-[72px] matches the exact MobileNav height so content is never hidden under it */}
      <div className="flex-1 flex flex-col w-full max-w-full min-w-0 min-h-0 pb-[72px] md:pb-0">
        {children}
      </div>
      <MobileNav userRole={role} />
      <AiChatBubble />
    </div>
  );
}
