import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user || user.role !== "owner") redirect("/dashboard");

  // Already onboarded → skip straight to dashboard
  if (user.store?.onboarded) redirect("/dashboard");

  return (
    <OnboardingClient
      storeId={user.store_id!}
      storeName={user.store?.name || "My Store"}
      ownerName={user.name}
    />
  );
}
