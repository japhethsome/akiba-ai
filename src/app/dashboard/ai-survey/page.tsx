import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AISurveyClient from "./AISurveyClient";

export default async function AISurveyPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (session.role === "superadmin") redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user) redirect("/auth");
  if (!user.store_id) redirect("/auth");

  if (user.role === "owner" && !user.store?.onboarded) {
    redirect("/dashboard/onboarding");
  }

  return <AISurveyClient />;
}

