import React from "react";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";
import { AiChatBubble } from "./AiChatBubble";

import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session?.role || "clerk";

  let userName = "";
  let avatar = "";
  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      select: { name: true, avatar: true }
    });
    userName = user?.name || "";
    avatar = user?.avatar || "";
  }

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full bg-[#f8faf9] text-[#171d1a] font-sans selection:bg-[#00a87a]/20 relative overflow-x-hidden">
      <TopNav userRole={role} userName={userName} avatar={avatar} />
      {/* pt-20 shifts page content down to prevent overlap by the fixed topnav. pb-[72px] matches the mobile navbar. */}
      <div className="flex-1 flex flex-col w-full max-w-full min-w-0 min-h-0 pt-20 pb-[72px] md:pb-0">
        {children}
      </div>
      <MobileNav userRole={role} />
      <AiChatBubble />
    </div>
  );
}
