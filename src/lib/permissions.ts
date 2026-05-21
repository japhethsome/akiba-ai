export const ALL_PERMISSIONS = [
  "pos",
  "inventory_view",
  "inventory_edit",
  "suppliers",
  "transactions",
  "reports",
  "staff"
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<Permission, { label: string; description: string }> = {
  pos: { label: "POS Register", description: "Access the Point of Sale system to sell products" },
  inventory_view: { label: "View Inventory", description: "View products and current stock levels" },
  inventory_edit: { label: "Edit Inventory", description: "Add/Edit products, adjust prices and stock quantities" },
  suppliers: { label: "Manage Suppliers", description: "View suppliers and place/manage restock orders" },
  transactions: { label: "View Transactions", description: "View complete sales history and receipts" },
  reports: { label: "Reports & Forecasts", description: "Access financial reports and AI demand forecasting" },
  staff: { label: "Staff Management", description: "Add attendants and manage their feature permissions" }
};

export function hasPermission(userRole: string | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  // Owners have all permissions
  if (userRole === "owner") return true;

  // Split role and custom permissions if formatted like role:perm1,perm2
  const parts = userRole.split(":");
  const baseRole = parts[0];
  
  if (parts.length > 1) {
    const permissions = parts[1].split(",");
    return permissions.includes(permission);
  }

  // Legacy role handling
  if (baseRole === "clerk" || baseRole === "attendant") {
    // Default legacy permissions
    const legacyPermissions: Permission[] = ["pos", "inventory_view", "transactions"];
    return legacyPermissions.includes(permission);
  }

  return false;
}

export function getRolePermissions(userRole: string | null | undefined): Permission[] {
  if (!userRole) return [];
  if (userRole === "owner") return [...ALL_PERMISSIONS];

  const parts = userRole.split(":");
  if (parts.length > 1) {
    return parts[1].split(",").filter((p): p is Permission => ALL_PERMISSIONS.includes(p as Permission));
  }

  if (parts[0] === "clerk" || parts[0] === "attendant") {
    return ["pos", "inventory_view", "transactions"];
  }

  return [];
}
