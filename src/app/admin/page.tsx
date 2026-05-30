import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SuperAdminClient } from "./SuperAdminClient";
import { getAllStores, getAllUsers, getSuperAdminOverview, getSuperAdminProfile } from "@/lib/actions/superadmin";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== "superadmin") {
    redirect("/auth");
  }

  const [overview, stores, users, profile] = await Promise.all([
    getSuperAdminOverview(),
    getAllStores(),
    getAllUsers(),
    getSuperAdminProfile(),
  ]);

  return (
    <SuperAdminClient
      overview={overview}
      stores={stores as any}
      users={users}
      profile={profile as any}
    />
  );
}
